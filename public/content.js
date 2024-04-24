window.addEventListener('message', function (e) {
    // We only accept messages from ourselves
    if (e.source !== window) {
        return;
    }
    console.debug("content", e.data);

    if (e.data.type === "ExtensionInstalled" && e.data.ask) {
        window.postMessage({type: "ExtensionInstalled", ask: false, installed: true});
    }

    if (e.data.type === "Connect" && e.data.ask) {
        chrome.runtime.sendMessage(e.data, function (response) {
            console.debug("content", response);
            window.postMessage({type: "Connect", ask: false, connected: response.connected});
            chrome.storage.local.set({expired: e.data.expired}).then((r) => {
            });
        });
    }
});