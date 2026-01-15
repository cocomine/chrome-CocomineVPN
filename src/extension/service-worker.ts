import type {RuntimeMessage, StoredVmData, VMInstanceDataType} from './types';
import {createProxyConfig} from "./createProxyConfig";
import {logConnectTrack, logDisconnectTrack} from "./shared";

const API_URL = 'https://api.cocomine.cc'; // API endpoint, in this time is only for ping test
const WEB_URL = process.env.NODE_ENV === "development" ? 'http://localhost:3000' : 'https://vpn.cocomine.cc'; // Web URL for user interactions
let pingInterval: NodeJS.Timeout | undefined; // To hold the interval ID for pinging

/**
 * Event listener for the `onInstalled` event.
 * This event is triggered when the extension is installed or updated.
 * Depending on the reason for the event, it opens the README.md file on GitHub.
 */
chrome.runtime.onInstalled.addListener(async ({reason}) => {
    if (reason === 'install') {
        console.log("Extension installed");
        await chrome.tabs.create({url: 'https://github.com/cocomine/chrome-vpn/blob/master/README.md'});
    } else if (reason === 'update') {
        console.log("Extension updated");
        await chrome.tabs.create({url: 'https://github.com/cocomine/chrome-vpn/blob/master/README.md#220'});
    }
});

/**
 * Event listener for the `onAlarm` event.
 * This event is triggered when an alarm goes off.
 * Specifically, it checks if the VPN will close soon, every 30 minutes.
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {

    // Check if the alarm is for offline time check
    if (alarm.name === 'offline-time-check') {

        const data = await chrome.storage.local.get<StoredVmData>('vmData');
        const vm = data.vmData;
        if (!vm) return; // No VM data found
        const expiresAt = new Date(vm._expired ?? Date.now()).getTime();

        // Less than 1 hour left but more than 30 minutes left
        if (expiresAt - Date.now() <= 60 * 60 * 1000 && expiresAt - Date.now() > 30 * 60 * 1000) {
            console.log("VPN will close in less than 1 hour");
            await chrome.notifications.clear('offlineTimeNotify');
            await chrome.notifications.create('offlineTimeNotify', {
                type: 'basic',
                iconUrl: 'icon-128.png',
                title: 'VPN節點即將關閉',
                message: `${vm._country}(${vm._name}) VPN節點即將1小時內關閉。如有需要請點擊延長開放時間。`,
                buttons: [{title: '延長開放時間'}],
            });
            return;
        }

        // Less than 30 minutes left but more than 0 minutes left
        if (expiresAt - Date.now() <= 30 * 60 * 1000 && expiresAt - Date.now() > 0) {
            console.log("VPN will close in less than 30 minutes");
            await chrome.notifications.clear('offlineTimeNotify');
            await chrome.notifications.create('offlineTimeNotify', {
                type: 'basic',
                iconUrl: 'icon-128.png',
                title: 'VPN節點即將關閉',
                message: `${vm._country}(${vm._name}) VPN節點即將30分鐘內關閉。如有需要請點擊延長開放時間。`,
                buttons: [{title: '延長開放時間'}],
            });
            return;
        }

        // Clear the current alarm
        if (expiresAt - Date.now() <= 0) await chrome.alarms.clear('offline-time-check');
    }

    // Check if the alarm is for offline time reached
    if (alarm.name === 'offline-time-reached') {
        console.log("VPN time reached, disconnecting...");

        const vm = await disconnect();
        if (!vm) return;
        await chrome.notifications.create('timeReachedNotify', {
            type: 'basic',
            iconUrl: 'icon-128.png',
            title: 'VPN節點已關閉',
            message: `${vm._country}(${vm._name}) VPN節點已關閉。如有需要請重新連接。`,
            buttons: [{title: '重新連接'}],
        });
    }

    // Check if the alarm is for heartbeat
    if (alarm.name === 'heartbeat') {
        console.log("Heartbeat alarm triggered");

        const data = await chrome.storage.local.get<StoredVmData>('vmData');
        const vm = data.vmData;
        if (!vm) return; // No VM data found

        // Send a heartbeat ping to the API
        try {
            const response = await fetch(`${API_URL}/ping`, {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
            });
            if (!response.ok) throw new Error('Heartbeat ping failed'); // If response is not OK, throw an error

            console.log('Heartbeat ping successful');
            await logConnectTrack(vm); // Log the heartbeat as a connect event
        } catch (e) {
            console.error('Heartbeat ping failed', e);
        }
    }
});

/**
 * Event listener for the `onClicked` event.
 * This event is triggered when a notification is clicked.
 * Specifically, it handles the click event for the 'offlineTimeNotify' notification.
 */
chrome.notifications.onClicked.addListener(async (notificationId) => {
    // Handle click event for 'offlineTimeNotify' notification
    if (notificationId === 'offlineTimeNotify') {
        const data = await chrome.storage.local.get<StoredVmData>('vmData');
        const vm = data.vmData;
        if (!vm) return; // No VM data found

        // Open the URL to extend time
        await chrome.tabs.create({url: `${WEB_URL}/${vm._id}#extendTime`});
    }

    // Handle click event for 'timeReachedNotify' notification
    if (notificationId === 'timeReachedNotify') {
        await chrome.tabs.create({url: `${WEB_URL}`});
    }
});

/**
 * Event listener for the `onButtonClicked` event.
 * This event is triggered when a notification button is clicked.
 * Specifically, it handles the button click event for the 'offline-time-check' notification.
 */
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
    // Handle button click event for 'offlineTimeNotify' notification
    if (notificationId === 'offlineTimeNotify' && buttonIndex === 0) {
        const data = await chrome.storage.local.get<StoredVmData>('vmData');
        const vm = data.vmData;
        if (!vm) return; // No VM data found

        // Open the URL to extend time
        await chrome.tabs.create({url: `${WEB_URL}/${vm._id}#extendTime`});
    }

    // Handle button click event for 'timeReachedNotify' notification
    if (notificationId === 'timeReachedNotify' && buttonIndex === 0) {
        await chrome.tabs.create({url: `${WEB_URL}`});
    }
});

/**
 * Event listener for the `onMessage` event.
 * This event is triggered when a message is sent from the content script.
 * Specifically, it handles the 'Connect' message type to set up a proxy configuration.
 */
chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
    console.debug('Service worker received message:', message); // Debug log

    // Handle the 'Connect' message type
    if (message.type === 'Connect') {
        (async () => {
            const {config, vmData, cleanup} = await createProxyConfig(message.data);
            console.debug(config, vmData, cleanup); //debug
            await chrome.proxy.settings.set({value: config, scope: 'regular'});
            if (cleanup) cleanup();

            // every 1s, send request to /ping to check if the proxy is connected
            // terminate after 60s if not connected
            let tryCount = 0;
            pingInterval && clearInterval(pingInterval); // Clear any existing ping intervals
            pingInterval = setInterval(async () => {
                try {
                    const response = await fetch(`${API_URL}/ping`, {
                        method: 'HEAD',
                        signal: AbortSignal.timeout(1000)
                    });
                    if (!response.ok) throw new Error('Ping failed'); // If response is not OK, throw an error to trigger the catch block

                    // Ping successful
                    clearInterval(pingInterval);
                    await chrome.storage.local.set({vmData}); // Save the vmData to chrome.storage.local

                    // Notify the user that the connection is successful
                    await chrome.notifications.clear('connectedNotify');
                    await chrome.notifications.create('connectedNotify', {
                        type: 'basic',
                        iconUrl: 'icon-128.png',
                        title: '成功連接',
                        message: '已成功連接到節點!',
                    });

                    await createAlarms(vmData); // Create alarms based on the VM data
                    sendResponse({connected: true}); // Send success response

                    console.log('Ping successful, proxy is connected');

                    // save connected time to track VPN usage
                    await logConnectTrack(vmData);
                } catch (e) {
                    // Ping failed, increment tryCount and check if we should stop trying
                    console.log('Ping attempt failed, retrying...', e);
                    tryCount++;
                    if (tryCount > 60) {
                        clearInterval(pingInterval);
                        await chrome.proxy.settings.clear({});
                        sendResponse({connected: false});
                    }
                }
            }, 1000);
        })();
        return true;
    }

    // Handle the 'Disconnect' message type
    if (message.type === 'Disconnect') {
        disconnect().then(() => sendResponse({connected: false})); // Send success response
        return true;
    }

    // Handle the 'AlarmsUpdate' message type
    if (message.type === 'AlarmsUpdate') {
        (async () => {
            const vmData = message.data;

            await createAlarms(vmData); // Update alarms based on new VM data
            await chrome.storage.local.set({vmData}); // Update stored VM data
            sendResponse({updated: true}); // Send success response
        })();
        return true;
    }

    // Handle the 'ConnectByExtension' message type
    if (message.type === 'ConnectByExtension') {
        (async () => {
            // Get the current proxy settings
            const config = await chrome.proxy.settings.get({});
            const value = config.value;
            console.debug(config); //debug

            // Check if connected to vpn.cocomine.cc
            if (config.levelOfControl === 'controlled_by_this_extension' && (value.mode === 'fixed_servers' || value.mode === 'pac_script')) {
                sendResponse({connectByExtension: true});
            } else {
                sendResponse({connectByExtension: false});
            }
        })();
        return true;
    }
    return false;
});

/**
 * Create alarms based on the VM data.
 * @param vmData - The VM instance data.
 */
async function createAlarms(vmData: VMInstanceDataType) {
    // Set up an alarm to check for offline time every 15 minutes
    // starting 1 hour before expiration
    await chrome.alarms.clearAll();
    const expiresAt = new Date(vmData._expired ?? Date.now()).getTime();
    await chrome.alarms.create('offline-time-check', {
        periodInMinutes: 15,
        when: expiresAt - 60 * 60 * 1000
    });
    // Set up an alarm to disconnect when expiration time is reached
    // Note: This alarm will be created at the exact expiration time
    await chrome.alarms.create('offline-time-reached', {
        when: expiresAt
    });
    // Set up a heartbeat alarm every 60 minutes
    await chrome.alarms.create('heartbeat', {
        periodInMinutes: 60,
        delayInMinutes: 30
    });
}

/**
 * Disconnect from the proxy and clear settings.
 */
async function disconnect(): Promise<VMInstanceDataType | undefined> {
    // Retrieve stored VM data
    const stored = await chrome.storage.local.get<StoredVmData>('vmData');
    const vmData = stored.vmData;

    // Clear proxy settings and stored VM data
    await chrome.proxy.settings.clear({});
    await chrome.storage.local.remove('vmData');
    await chrome.notifications.clear('disconnectedNotify');
    await chrome.notifications.create('disconnectedNotify', {
        type: 'basic',
        iconUrl: 'icon-128.png',
        title: '已斷開連接',
        message: '已成功斷開與節點的連接!',
    });
    await chrome.alarms.clearAll();

    console.log('Disconnected from proxy');

    // save disconnected time to track VPN usage
    if (vmData) {
        await logDisconnectTrack(vmData);
    }
    return vmData;
}