window.addEventListener('message', function(e) {
    // We only accept messages from ourselves
    if (e.source !== window) {
        return;
    }

    if (e.data.type === "ExtensionInstalled" && e.data.ask) {
        console.debug(e.data);
        window.postMessage({ type: "ExtensionInstalled", ask: false, installed: true });
    }

});