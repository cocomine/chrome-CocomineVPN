window.addEventListener('message', async function (e) {
    // We only accept messages from ourselves
    if (e.source !== window) return;
    console.debug("Content script > message", e.data); //debug

    // Check if the extension is installed
    if (e.data.type === "ExtensionInstalled" && e.data.ask) {
        window.postMessage({type: "ExtensionInstalled", ask: false, data: {installed: true, version: chrome.runtime.getManifest().version}});
    }

    // Receive the Connect message
    if (e.data.type === "Connect" && e.data.ask) {
        chrome.runtime.sendMessage({type: "Connect", data: e.data.data}, function (response) {
            //console.debug("Content script > Connect", response); //debug
            window.postMessage({type: "Connect", ask: false, data:{connected: response.connected}});
        });
    }

    // Receive the PostVMData message
    if (e.data.type === "PostVMData" && !e.data.ask) {
        chrome.storage.local.get('vmData', (data) => {
            //console.debug("Content script > PostVMData", data) //debug
            if (!data.vmData) return
            const vmData = e.data.data.find((d) => d._id === data.vmData._id)

            if(vmData._isPowerOn){
                // If the VM is powered on, save the data to chrome.storage.local
                chrome.storage.local.set({vmData})
            }else{
                // If the VM is powered off, send the data to service worker
                chrome.runtime.sendMessage({type: "Disconnect", data: vmData});
            }
        });

    }
});

