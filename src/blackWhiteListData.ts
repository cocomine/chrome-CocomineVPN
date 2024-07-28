import {useEffect, useState} from "react";

type ProxyMode = 'whitelist' | 'blacklist' | 'disable';

function useProxyMode() {
    const [mode, setMode] = useState<ProxyMode>('disable');

    useEffect(() => {
        // Check if chrome.storage is available
        if(chrome.storage === undefined) return;

        // Get the proxyMode from chrome.storage.local
        chrome.storage.local.get('proxyMode', (data) => {
            console.debug(data) //debug
            setMode(data.proxyMode ?? 'disable')
        });

        // Add listener for changes in chatGPTOnly
        const listener = (changes: {[p: string]: chrome.storage.StorageChange}):void => {
            console.debug(changes) //debug
            if (changes.proxyMode) {
                setMode(changes.proxyMode.newValue)
            }
        }
        chrome.storage.onChanged.addListener(listener);

        return () => {
            chrome.storage.onChanged.removeListener(listener);
        }
    }, []);

    return {mode}
}

export {useProxyMode}
export type {ProxyMode}