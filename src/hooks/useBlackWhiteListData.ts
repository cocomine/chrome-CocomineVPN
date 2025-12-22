import {useEffect, useState} from "react";
import {ProxyMode, StorageLists} from "../extension/types";

/**
 * Custom hook to manage the data for a whitelist or blacklist.
 *
 * This hook retrieves the list from `chrome.storage.sync` and listens for changes to update the state.
 *
 * @param type - The type of list to manage ('whitelist' or 'blacklist').
 */
export default function useBlackWhiteListData(type: Exclude<ProxyMode, 'disable'>) {
    const [data, setData] = useState<string[]>([]);

    useEffect(() => {
        // Check if chrome.storage is available
        if (chrome.storage === undefined) return;

        // Get the list from chrome.storage.sync
        chrome.storage.sync.get<StorageLists>(type, (data) => {
            setData(data[type] ?? [])
        });

        // Add listener for changes in chatGPTOnly
        const listener = (changes: { [p: string]: chrome.storage.StorageChange }): void => {
            if (changes[type]) {
                const updated = changes[type].newValue;
                setData(Array.isArray(updated) ? updated : []);
            }
        }
        chrome.storage.onChanged.addListener(listener);

        return () => {
            chrome.storage.onChanged.removeListener(listener);
        }
    }, [type]);

    return {data}
}