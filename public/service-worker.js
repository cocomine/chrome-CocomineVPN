const API_URL = 'https://api.cocomine.cc'; // The API URL

/**
 * Event listener for the `onInstalled` event.
 * This event is triggered when the extension is installed or updated.
 * Depending on the reason for the event, it opens the README.md file on GitHub.
 */
chrome.runtime.onInstalled.addListener(({reason}) => {
    if (reason === 'install') {
        chrome.tabs.create({url: 'https://github.com/cocomine/chrome-vpn/blob/master/README.md'});
    } else if (reason === 'update') {
        chrome.tabs.create({url: 'https://github.com/cocomine/chrome-vpn/blob/master/README.md#118'});
    }
});

/**
 * Event listener for the `onAlarm` event.
 * This event is triggered when an alarm goes off.
 * Specifically, it checks if the VPN will close soon, every 30 minutes.
 */
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'offline-time-check') {
        // Get the vmData from chrome.storage.local
        chrome.storage.local.get('vmData', (data) => {
            //console.debug(data) //debug
            if (!data.vmData) return;

            //check if have 30min time left
            const expired = new Date(data.vmData._expired).getTime()
            if (expired - Date.now() < 30 * 60 * 1000) {
                // notify user
                chrome.notifications.clear('offlineTimeNotify');
                chrome.notifications.create('offlineTimeNotify', {
                    type: 'basic',
                    iconUrl: 'icon-128.png',
                    title: 'VPN節點即將關閉',
                    message: `${data.vmData._country}(${data.vmData._name}) VPN節點即將30分鐘內關閉。如有需要請點擊延長開放時間。`,
                    buttons: [{title: '延長開放時間'}]
                });

                //clear alarms
                chrome.alarms.clear('offline-time-check');
            }
        });
    }
});

/**
 * Event listener for the `onClicked` event.
 * This event is triggered when a notification is clicked.
 * Specifically, it handles the click event for the 'offlineTimeNotify' notification.
 */
chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId === 'offlineTimeNotify') {
        // Get the vmData from chrome.storage.local
        chrome.storage.local.get('vmData', (data) => {
            //console.debug(data) //debug
            if (!data.vmData) return;

            // open the web page
            chrome.tabs.create({url: `https://vpn.cocomine.cc/${data.vmData._id}#extendTime`});
        });
    }
});

/**
 * Event listener for the `onButtonClicked` event.
 * This event is triggered when a notification button is clicked.
 * Specifically, it handles the button click event for the 'offline-time-check' notification.
 */
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (notificationId === 'offlineTimeNotify' && buttonIndex === 0) {
        // Get the vmData from chrome.storage.local
        chrome.storage.local.get('vmData', (data) => {
            //console.debug(data) //debug
            if (!data.vmData) return;

            // open the web page
            chrome.tabs.create({url: `https://vpn.cocomine.cc/${data.vmData._id}#extendTime`});
        });
    }
});

/**
 * Event listener for the `onMessage` event.
 * This event is triggered when a message is sent from the content script.
 * Specifically, it handles the 'Connect' message type to set up a proxy configuration.
 *
 * @param {Object} message - The message object sent from the content script.
 * @param {string} message.type - The type of the message.
 * @param {Object} message.data - The data associated with the message.
 * @param {string} message.data.url - The URL for the proxy configuration.
 * @param {Object} sender - The sender of the message.
 * @param {Function} sendResponse - The function to send a response back to the sender.
 */
let interval;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.debug(message); //debug

    // Receive the Connect message
    if (message.type === 'Connect') {

        const socks5Profile = message.data._profiles.find((p) => p.type === "socks5");
        create_config(socks5Profile.url, (config) => {
            console.debug(config); //debug
            chrome.proxy.settings.set({value: config, scope: "regular"}, () => {

                // every 1s, send request to /ping to check if the proxy is connected
                // terminate after 60s if not connected
                let tryCount = 0;
                interval && clearInterval(interval);
                interval = setInterval(() => {
                    fetch(`${API_URL}/ping`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        signal: AbortSignal.timeout(1000)
                    }).then((response) => {
                        if (response.ok) {
                            clearInterval(interval);
                            sendResponse({connected: true});

                            // Save the vmData to chrome.storage.local
                            chrome.storage.local.set({vmData: message.data});

                            // Notify the user that the connection is successful
                            chrome.notifications.clear('connectedNotify');
                            chrome.notifications.create('connectedNotify', {
                                type: 'basic',
                                iconUrl: 'icon-128.png',
                                title: '成功連接',
                                message: '已成功連接到節點!',
                            });

                            // set up every 30min alarms, check how many times left
                            chrome.alarms.clearAll();
                            chrome.alarms.create('offline-time-check', {periodInMinutes: 30});
                        }else{
                            tryCount++;
                            if(tryCount >= 60){
                                sendResponse({connected: false});
                                clearInterval(interval);
                            }
                        }
                    }).catch(() => {
                        tryCount++;
                        if(tryCount >= 60){
                            sendResponse({connected: false});
                            clearInterval(interval);
                        }
                    });
                }, 1000);
            });
        })
        return true
    }

    // Receive the Disconnect message
    if (message.type === 'Disconnect') {
        // clear proxy settings
        chrome.proxy.settings.clear({}, () => {
            // Remove the vmData from chrome.storage.local
            chrome.storage.local.remove('vmData');

            // Notify the user that the connection is disconnected
            chrome.notifications.clear('disconnectedNotify');
            chrome.notifications.create('disconnectedNotify', {
                type: 'basic',
                iconUrl: 'icon-128.png',
                title: '已斷開連接',
                message: '已成功斷開與節點的連接!',
            });

            // clear alarms
            chrome.alarms.clearAll();

            // send response
            sendResponse({connected: false});
        });
        return true
    }
});

/**
 * Event listener for the `onStartup` event.
 * This event is triggered when the browser starts up.
 * It checks if the `vmData` has expired and clears the proxy settings if it has.
 */
chrome.runtime.onStartup.addListener(() => {
    // Get the vmData from chrome.storage.local
    chrome.storage.local.get('vmData', (data) => {
        console.debug(data) //debug
        if (!data.vmData) return;

        const expired = new Date(data.vmData._expired).getTime()
        if (expired < Date.now()) {
            // clear proxy settings
            chrome.proxy.settings.clear({}, () => {
                chrome.storage.local.remove('vmData');
            });
        }
    });
});

// The `create_config` function is used to create a proxy configuration.
function create_config(proxy_url, callback) {
    // Get the `chatgpt-only` from chrome.storage.local
    chrome.storage.local.get(['chatGPTOnly', 'proxyMode'], (data) => {
        console.debug(data) //debug

        if (data.proxyMode === 'whitelist' || data.proxyMode === 'blacklist') {
            chrome.storage.sync.get(data.proxyMode, (url_list) => {
                const pac_script = create_pac_script_custom_rule(proxy_url, data.proxyMode, url_list[data.proxyMode]);
                callback({
                    mode: "pac_script",
                    pacScript: {
                        data: pac_script
                    }
                })
            });
        } else if (data.chatGPTOnly) {
            // Create a PAC script that routes traffic through the SOCKS5 proxy for openai.com and chatgpt.com
            const pac_script = create_pac_script(proxy_url);
            callback({
                mode: "pac_script",
                pacScript: {
                    data: pac_script
                }
            })
        } else {
            // Set the proxy server to the SOCKS5 proxy
            const [host, port] = proxy_url.split(':');
            callback({
                mode: "fixed_servers",
                rules: {
                    singleProxy: {
                        scheme: "socks5",
                        host: host,
                        port: parseInt(port)
                    }
                }
            })
        }
    });
}

// create a PAC script that routes traffic through the SOCKS5 proxy for openai.com and chatgpt.com
function create_pac_script(proxy_url) {
    return `function FindProxyForURL(url, host) {
        alert(url);
        alert(shExpMatch(url, "*api.cocomine.cc/ping"));
        if (dnsDomainIs(host, "openai.com") || dnsDomainIs(host, "chatgpt.com") || dnsDomainIs(host, "api.cocomine.cc") || dnsDomainIs(host, "sora.com")){
            return "SOCKS5 ${proxy_url}";
        }
        return "DIRECT";
    }`.replaceAll('\n', '');
}

// create a PAC script that routes traffic through the SOCKS5 proxy for custom url list
function create_pac_script_custom_rule(proxy_url, proxy_mode, url_list) {
    return `function FindProxyForURL(url, host) {
        if (dnsDomainIs(host, "api.cocomine.cc") || ${proxy_mode === 'whitelist' ? url_list.map((url) => `shExpMatch(host, "${url}")`).join(' || ') : url_list.map((url) => `!shExpMatch(host, "${url}")`).join(' && ')}){
            return "SOCKS5 ${proxy_url}";
        }
        return "DIRECT";
    }`.replaceAll('\n', '');
}
