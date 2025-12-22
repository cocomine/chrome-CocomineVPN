import {useEffect, useState} from "react";

/**
 * `useChatGPTOnlyData` is a custom React hook that manages the state and effects related to the `chatGPTOnly` data.
 * It returns an object containing the `chatGPTOnly` state.
 *
 * @returns The state value for `chatGPTOnly`.
 * @returns {boolean} chatGPTOnly - A boolean indicating whether the user has enabled the `chatGPTOnly` mode.
 */
export default function useChatGPTOnlyData() {
    const [chatGPTOnly, setChatGPTOnly] = useState(false);

    useEffect(() => {
        // Check if chrome.storage is available
        if (chrome.storage === undefined) return;

        // Get the chatGPTOnly from chrome.storage.local
        chrome.storage.local.get<{ chatGPTOnly: boolean }>('chatGPTOnly', (data) => {
            console.debug(data) //debug
            setChatGPTOnly(Boolean(data.chatGPTOnly))
        });

        // Add listener for changes in chatGPTOnly
        const listener = (changes: { [p: string]: chrome.storage.StorageChange }): void => {
            console.debug(changes) //debug
            if (changes.chatGPTOnly) {
                setChatGPTOnly(Boolean(changes.chatGPTOnly.newValue))
            }
        }
        chrome.storage.onChanged.addListener(listener);

        return () => {
            chrome.storage.onChanged.removeListener(listener);
        }
    }, []);

    return {chatGPTOnly}

}
