chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        //chrome.tabs.create({ url: 'https://www.google.com' });
    }
});