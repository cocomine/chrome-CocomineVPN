import type {ExtensionMessage, StoredTrackData, VMInstanceDataType} from './types';

/**
 * Post a message to the web page.
 * @param message - The message to post.
 */
export const postToPage = (message: ExtensionMessage) => {
    window.postMessage(message);
};

/**
 * Ensure that the Chrome runtime is ready before proceeding.
 * This function checks if `chrome.runtime.id` is available,
 * and if not, it waits briefly before resolving.
 */
export const ensureRuntimeReady = async () => {
    if (!chrome?.runtime?.id) {
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
};

/**
 * Log a connect track event.
 * @param data - The VM instance data.
 */
export const logConnectTrack = async (data: VMInstanceDataType) => {
    const stored = await chrome.storage.local.get<StoredTrackData>('trackData');
    const trackData = stored.trackData || [];
    trackData.push({
        datetime: new Date().toISOString(),
        country: data._country,
        target: true
    });
    await chrome.storage.local.set({trackData});

}

/**
 * Log a disconnect track event.
 * @param data - The VM instance data.
 */
export const logDisconnectTrack = async (data: VMInstanceDataType) => {
    const stored = await chrome.storage.local.get<StoredTrackData>('trackData');
    const trackData = stored.trackData || [];
    trackData.push({
        datetime: new Date().toISOString(),
        country: data._country,
        target: false
    });
    await chrome.storage.local.set({trackData});
}