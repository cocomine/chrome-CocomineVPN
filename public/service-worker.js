chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        chrome.tabs.create({ url: 'https://github.com/cocomine/chrome-vpn/blob/master/README.md' });
    }
});

// The `onMessage` event listener is used to receive messages from the content script.
chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {
    console.debug(message);

    if (message.type === 'Connect') {
        const [host, port] = message.data.url.split(':');

        const config = {
            mode: "fixed_servers",
            rules: {
                singleProxy: {
                    scheme: "socks5",
                    host: host,
                    port: parseInt(port)
                }
            }
        };
        chrome.proxy.settings.set({value: config, scope: "regular"}, () => {
            sendResponse({ connected: true });
        });
        return true
    }
});

// The `onStartup` event listener is used to check if the vmData has expired.
chrome.runtime.onStartup.addListener(() => {
    // Get the vmData from chrome.storage.local
    chrome.storage.local.get('vmData', (data) => {
        console.debug(data) //debug
        if (!data.vmData) return;

        const expired = new Date(data.vmData._expired).getTime()
        if(expired < Date.now()) {
            // clear proxy settings
            chrome.proxy.settings.clear({}, () => {
                chrome.storage.local.remove('vmData');
            });
        }
    });
});