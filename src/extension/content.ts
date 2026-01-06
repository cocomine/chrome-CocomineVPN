import {ensureRuntimeReady, postToPage} from './shared';
import type {ExtensionMessage, StoredTrackData, StoredVmData, VMInstanceDataType} from './types';

/**
 * Listen for messages from the web page and handle them accordingly.
 */
window.addEventListener('message', async (event: MessageEvent<ExtensionMessage>) => {
    if (event.source !== window) return; // Only accept messages from the same window
    const message = event.data; // Extract the message data
    console.debug('Content script received message:', message); // Debug log
    if (!message?.type) return; // Ignore messages without a type

    await ensureRuntimeReady(); // Ensure the Chrome runtime is ready

    // Handle 'ExtensionInstalled' message
    if (message.type === 'ExtensionInstalled' && message.ask) {
        postToPage({
            type: 'ExtensionInstalled',
            ask: false,
            data: {installed: true, version: chrome.runtime.getManifest().version}
        });
        return;
    }

    // Handle 'Connect' message
    if (message.type === 'Connect' && message.ask) {
        const response = await chrome.runtime.sendMessage({type: 'Connect', data: message.data})
        postToPage({type: 'Connect', ask: false, data: {connected: Boolean(response?.connected)}});
        return;
    }

    // Handle 'PostVMData' message
    if (message.type === 'PostVMData' && !message.ask) {
        const stored = await chrome.storage.local.get<StoredVmData>('vmData');
        const storedVm = stored.vmData; // Get the stored VM data
        if (!storedVm) return; // No stored VM data found

        // Find the incoming VM data that matches the stored VM ID
        const incomingVm = findVmById(message.data, storedVm._id);
        if (!incomingVm) return;

        // Update storage or send disconnect message based on power state
        if (incomingVm._isPowerOn) {
            //todo: update alarms
            await chrome.runtime.sendMessage({type: 'AlarmsUpdate', data: incomingVm}); // Send alarms update message
        } else {
            await chrome.runtime.sendMessage({type: 'Disconnect', data: incomingVm}); // Send disconnect message
        }
    }

    //todo: retrieve tracked VPN usage from storage and send to page
    if (message.type === 'RetrieveTrackedUsage' && message.ask) {
        const stored = await chrome.storage.local.get<StoredTrackData>('trackData');
        const trackData = stored.trackData; // Get the stored VM data
        if (!trackData) return; // No stored VM data found

        postToPage({
            type: 'RetrieveTrackedUsage',
            ask: false,
            data: trackData
        });
        await chrome.storage.local.remove('trackData') // Clear tracked data after sending
    }
});

/**
 * Find a VM by its ID in a list of VMs.
 * @param list - The list of VMs to search.
 * @param id - The ID of the VM to find.
 * @returns The VM with the matching ID, or undefined if not found.
 */
const findVmById = (list: VMInstanceDataType[], id: string) => list.find((entry) => entry?._id === id);