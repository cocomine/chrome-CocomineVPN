chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        chrome.tabs.create({ url: 'https://github.com/cocomine/chrome-vpn/blob/dev/README.md' });
    }
});