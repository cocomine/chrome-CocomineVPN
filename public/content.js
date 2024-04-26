window.addEventListener('message', function (e) {
    // We only accept messages from ourselves
    if (e.source !== window) return;
    console.debug("content.js", e.data);

    if (e.data.type === "ExtensionInstalled" && e.data.ask) {
        window.postMessage({type: "ExtensionInstalled", ask: false, data: {installed: true}});
    }

    if (e.data.type === "Connect" && e.data.ask) {
        const socks5Profile = e.data.data._profiles.find((p) => p.type === "socks5");
        chrome.runtime.sendMessage({type: "Connect", data: socks5Profile}, function (response) {
            console.debug("content", response);
            window.postMessage({type: "Connect", ask: false, data:{connected: response.connected}});
            chrome.storage.local.set({vmData: e.data.data})
        });
    }
});