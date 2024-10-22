window.addEventListener('message', async function (e) {
    // We only accept messages from ourselves
    if (e.source !== window) return;
    console.debug("Content script", e.data);

    // Check if the extension is installed
    if (e.data.type === "ExtensionInstalled" && e.data.ask) {
        window.postMessage({type: "ExtensionInstalled", ask: false, data: {installed: true, version: chrome.runtime.getManifest().version}});
    }

    // Receive the Connect message
    if (e.data.type === "Connect" && e.data.ask) {
        const socks5Profile = e.data.data._profiles.find((p) => p.type === "socks5");
        chrome.runtime.sendMessage({type: "Connect", data: socks5Profile}, function (response) {
            console.debug("Content script > Connect", response);
            window.postMessage({type: "Connect", ask: false, data:{connected: response.connected}});
            chrome.storage.local.set({vmData: e.data.data})
        });
    }

    // Receive the PostVMData message
    if (e.data.type === "PostVMData" && !e.data.ask) {
        chrome.storage.local.get('vmData', (data) => {
            console.debug("Content script > PostVMData", data) //debug
            if (!data.vmData) return
            chrome.storage.local.set({vmData: e.data.data.find((d) => d._id === data.vmData._id)})
        });

    }
});

