// The `onInstalled` event listener is used to open the README.md file on GitHub when the extension is installed or updated.
chrome.runtime.onInstalled.addListener(({reason}) => {
    if (reason === 'install') {
        chrome.tabs.create({url: 'https://github.com/cocomine/chrome-vpn/blob/master/README.md'});
    } else if (reason === 'update') {
        chrome.tabs.create({url: 'https://github.com/cocomine/chrome-vpn/blob/master/README.md#023'});
    }
});


// The `onMessage` event listener is used to receive messages from the content script.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.debug(message);

    if (message.type === 'Connect') {

        create_config(message.data.url, (config) => {
            console.debug(config); //debug
            chrome.proxy.settings.set({value: config, scope: "regular"}, () => {
                sendResponse({connected: true});
            });
        })
        return true
    }
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

// The `onStartup` event listener is used to check if the vmData has expired.
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

// create a PAC script that routes traffic through the SOCKS5 proxy for openai.com and chatgpt.com
function create_pac_script(proxy_url) {
    return `function FindProxyForURL(url, host) {
        if (dnsDomainIs(host, "openai.com") || dnsDomainIs(host, "chatgpt.com")){
            return "SOCKS5 ${proxy_url}";
        }
        return "DIRECT";
    }`;
}

// create a PAC script that routes traffic through the SOCKS5 proxy for custom url list
function create_pac_script_custom_rule(proxy_url, proxy_mode, url_list) {
    return `function FindProxyForURL(url, host) {
        if (${proxy_mode === 'whitelist' ? url_list.map((url) => `shExpMatch(host, "${url}")`).join(' || ') : url_list.map((url) => `!shExpMatch(host, "${url}")`).join(' && ')}){
            return "SOCKS5 ${proxy_url}";
        }
        return "DIRECT";
    }`;
}