import {useEffect, useState} from "react";

/**
 * Type definition for the list type.
 *
 * @typedef {'whitelist' | 'blacklist'} ListType
 */
type ListType = 'whitelist' | 'blacklist';

/**
 * Interface for the properties of the AddURLModal component.
 *
 * @interface AddURLModalProps
 * @property {boolean} show - Indicates whether the modal is visible.
 * @property {function} onHide - Callback function to handle hiding the modal.
 * @property {string} url - The URL to be added.
 */
interface AddURLModalProps {
    show: boolean;
    onHide: () => void;
    url: string;
}

/**
 * Interface for the properties of the URLSelector component.
 *
 * @interface URLSelectorProps
 * @property {string} value - The current value of the URL selector.
 * @property {function} onSelect - Callback function to handle the selection of a URL.
 * @property {function} [onHover] - Optional callback function to handle hovering over a URL.
 */
interface URLSelectorProps {
    value: string;
    onSelect: (value: string) => void;
    onHover?: (value: string | null) => void;
}

/**
 * Custom hook to manage the data for a whitelist or blacklist.
 *
 * This hook retrieves the list from `chrome.storage.sync` and listens for changes to update the state.
 *
 * @param {ListType} type - The type of list to manage ('whitelist' or 'blacklist').
 * @returns {Object} An object containing the current list data.
 */
export default function useBlackWhiteListData(type: ListType) {
    const [data, setData] = useState<string[]>([]);

    useEffect(() => {
        // Check if chrome.storage is available
        if (chrome.storage === undefined) return;

        // Get the list from chrome.storage.sync
        chrome.storage.sync.get(type, (data) => {
            setData(data[type] ?? [])
        });

        // Add listener for changes in chatGPTOnly
        const listener = (changes: { [p: string]: chrome.storage.StorageChange }): void => {
            if (changes[type]) {
                setData(changes[type].newValue)
            }
        }
        chrome.storage.onChanged.addListener(listener);

        return () => {
            chrome.storage.onChanged.removeListener(listener);
        }
    }, [type]);

    return {data}
}

export type {ListType, AddURLModalProps, URLSelectorProps}