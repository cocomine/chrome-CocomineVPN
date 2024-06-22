chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        chrome.tabs.create({ url: 'https://github.com/cocomine/chrome-vpn/blob/master/README.md' });
    }else if(reason === 'update'){
        chrome.tabs.create({ url: 'https://github.com/cocomine/chrome-vpn/blob/master/README.md#013' });
    }
});

// The `onMessage` event listener is used to receive messages from the content script.
chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {
    console.debug(message);

    if (message.type === 'Connect') {

        // Get the `chatgpt-only` from chrome.storage.local
        chrome.storage.local.get('chatGPTOnly', (data) => {
            console.debug(data) //debug

            let config;
            if(data['chatGPTOnly']) {
                // Create a PAC script that routes traffic through the SOCKS5 proxy for openai.com and chatgpt.com
                const pac_script = create_pac_script(message.data.url);
                config = {
                    mode: "pac_script",
                    pacScript: {
                        data: pac_script
                    }
                };
            }else{
                // Set the proxy server to the SOCKS5 proxy
                const [host, port] = message.data.url.split(':');
                config = {
                    mode: "fixed_servers",
                    rules: {
                        singleProxy: {
                            scheme: "socks5",
                            host: host,
                            port: parseInt(port)
                        }
                    }
                };
            }

            chrome.proxy.settings.set({value: config, scope: "regular"}, () => {
                sendResponse({ connected: true });
            });
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

function create_pac_script(proxy_url) {
    return `function FindProxyForURL(url, host) {
        if (dnsDomainIs(host, "openai.com") || dnsDomainIs(host, "chatgpt.com")){
            return "SOCKS5 ${proxy_url}";
        }
        return "DIRECT";
    }`;
}