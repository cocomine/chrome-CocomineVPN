import {useEffect, useState} from "react";

type ProxyMode = 'whitelist' | 'blacklist' | 'disable';
type ListType = 'whitelist' | 'blacklist';

interface AddURLModalProps {
    show: boolean;
    onHide: () => void;
    url: string;
}

interface URLSelectorProps {
    value: string;
    onSelect: (value: string) => void;
    onHover?: (value: string | null) => void;
}

function useProxyMode() {
    const [mode, setMode] = useState<ProxyMode>('disable');

    useEffect(() => {
        // Check if chrome.storage is available
        if (chrome.storage === undefined) return;

        // Get the proxyMode from chrome.storage.local
        chrome.storage.local.get('proxyMode', (data) => {
            console.debug(data) //debug
            setMode(data.proxyMode ?? 'disable')
        });

        // Add listener for changes in chatGPTOnly
        const listener = (changes: { [p: string]: chrome.storage.StorageChange }): void => {
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

function useBlackWhiteListData(type: ListType) {
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

export {useProxyMode, useBlackWhiteListData}
export type {ProxyMode, ListType, AddURLModalProps, URLSelectorProps}