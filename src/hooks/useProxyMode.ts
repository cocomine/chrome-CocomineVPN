import {useEffect, useState} from "react";

/**
 * Type definition for the proxy mode.
 *
 * @typedef {'whitelist' | 'blacklist' | 'disable'} ProxyMode
 */
type ProxyMode = 'whitelist' | 'blacklist' | 'disable';

/**
 * Custom hook to manage the proxy mode state.
 *
 * This hook retrieves the proxy mode from `chrome.storage.local` and listens for changes to update the state.
 *
 * @returns {Object} An object containing the current proxy mode.
 */
export default function useProxyMode() {
    const [mode, setMode] = useState<ProxyMode>('disable');

    useEffect(() => {
        // Check if chrome.storage is available
        if (chrome.storage === undefined) return;

        // Get the proxyMode from chrome.storage.local
        chrome.storage.local.get<{ proxyMode: ProxyMode }>('proxyMode', (data) => {
            console.debug(data) //debug
            setMode(data.proxyMode ?? 'disable')
        });

        // Add listener for changes in chatGPTOnly
        const listener = (changes: { [key: string]: chrome.storage.StorageChange }): void => {
            console.debug(changes) //debug
            if (changes.proxyMode) {
                const nextMode = changes.proxyMode.newValue as ProxyMode | undefined;
                setMode(nextMode ?? 'disable')
            }
        }
        chrome.storage.onChanged.addListener(listener);

        return () => {
            chrome.storage.onChanged.removeListener(listener);
        }
    }, []);

    return {mode}
}

export type {ProxyMode};