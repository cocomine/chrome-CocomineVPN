chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        chrome.tabs.create({ url: 'https://github.com/cocomine/chrome-vpn/blob/master/README.md' });
    }
});

/**
 * The `connect` function is used to set the proxy settings of the Chrome browser.
 * It takes a profile object as an argument, which contains a url property in the format 'host:port'.
 * The function returns a Promise that resolves when the proxy settings have been successfully set.
 *
 * @param {Object} profile - The profile object containing the url of the proxy.
 * @param {string} profile.url - The url of the proxy in the format 'host:port'.
 *
 * @returns {Promise} A Promise that resolves when the proxy settings have been successfully set.
 */

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