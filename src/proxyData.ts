import {useEffect, useState} from "react";

/**
 * Type definition for the country.
 * @typedef {("TW" | "JP" | "US" | "HK" | string)} country
 */
type countryType = "TW" | "JP" | "US" | "HK" | "UK" | string
/**
 * Type definition for the provider.
 * @typedef {("google" | "azure")} provider
 */
type providerType = "google" | "azure"
/**
 * Type definition for the profile.
 * @typedef {Object} profile
 * @property {("OpenVPN" | "SoftEther" | "SS")} type - The type of the profile.
 * @property {string} name - The name of the profile.
 * @property {string} filename - The filename of the profile.
 * @property {string} [url] - The url of the profile.
 */
type profileType = {
    "type": "OpenVPN" | "SoftEther" | "SS" | "socks5",
    "name": string,
    "filename": string
    "url"?: string
}
/**
 * Type definition for the read only mode.
 * @typedef {("startOnly" | "stopOnly" | "readOnly" | "disable")} readOnlyMode
 */
type readOnlyMode = "startOnly" | "stopOnly" | "readOnly" | "disable"
/**
 * Type definition for the VM data.
 * @typedef {Object} VMData
 * @property {string} _name - The name of the VM.
 * @property {string} _status - The status of the VM.
 * @property {string} _id - The id of the VM.
 * @property {string} _zone - The zone of the VM.
 * @property {string} _url - The url of the VM.
 * @property {country} _country - The country of the VM.
 * @property {profile[]} _profiles - The profiles of the VM.
 * @property {provider} _provider - The provider of the VM.
 * @property {boolean} _isPowerOn - The power status of the VM.
 * @property {readOnlyMode} _readonly - The read only mode of the VM.
 */
type VMDataType = {
    readonly _name: string;
    _status: string;
    readonly _id: string;
    readonly _zone: string;
    readonly _url: string
    readonly _country: countryType
    readonly _profiles: profileType[]
    readonly _provider: providerType
    _isPowerOn: boolean
    readonly _readonly: readOnlyMode,
    _expired: string | null
}

/**
 * `useProxyData` is a custom React hook that manages the state and effects related to proxy data.
 * It returns an object containing the connection status, country code, and VM data.
 *
 * @returns The state values for connected, country, and vmData.
 * @returns {boolean} connected - A boolean indicating whether the user is connected to vpn.cocomine.cc.
 * @returns {countryType | null} country - The country code of the VPN server, or null if not connected.
 * @returns {VMDataType | null} vmData - The VM data retrieved from chrome.storage.local, or null if not available.
 */
function useProxyData() {
    const [connected, setConnected] = useState(false);
    const [country, setCountry] = useState<countryType | null>(null);
    const [vmData, setVmData] = useState<VMDataType | null>(null);

    // Get the proxy data
    useEffect(() => {
        // Check if chrome.proxy is available
        if (chrome.proxy === undefined) return;

        // Get the current proxy settings
        chrome.proxy.settings.get({}, (config) => {
            const value = config.value
            console.debug(config) //debug

            // Check if connected to vpn.cocomine.cc
            if (config.levelOfControl === 'controlled_by_this_extension') {
                if((value.mode === 'fixed_servers') ||
                    (value.mode === 'pac_script')){
                    setConnected(true)
                }else {
                    setConnected(false)
                }
            } else {
                // Resolve the promise with the connection status as false and country as null
                setConnected(false)
                setCountry(null)
            }
        });

        // Add listener for changes in proxy settings
        const listener = (details: chrome.types.ChromeSettingGetResultDetails):void => {
            console.debug(details) //debug
            const value = details.value

            // Check if connected to vpn.cocomine.cc
            if (details.levelOfControl === 'controlled_by_this_extension') {
                if((value.mode === 'fixed_servers') ||
                    (value.mode === 'pac_script')){
                    setConnected(true)
                }else {
                    setConnected(false)
                }
            } else {
                // Resolve the promise with the connection status as false and country as null
                setConnected(false)
                setCountry(null)
            }
        }
        chrome.proxy.settings.onChange.addListener(listener);

        return () => {
            chrome.proxy.settings.onChange.removeListener(listener);
        }
    }, []);

    // Get the vmData
    useEffect(() => {
        // Check if chrome.storage is available
        if(chrome.storage === undefined) return;

        // Get the vmData from chrome.storage.local
        chrome.storage.local.get('vmData', (data) => {
            console.debug(data) //debug
            setVmData(data.vmData)
            setCountry(data.vmData?._country || null)
        });

        // Add listener for changes in vmData
        const listener = (changes: {[p: string]: chrome.storage.StorageChange}):void => {
            console.debug(changes) //debug
            if (changes.vmData) {
                setVmData(changes.vmData.newValue)
                setCountry(changes.vmData.newValue._country || null);
            }
        }
        chrome.storage.onChanged.addListener(listener);

        return () => {
            chrome.storage.onChanged.removeListener(listener);
        }
    }, []);

    return {connected, country, vmData}
}

/**
 * `useChatGPTOnlyData` is a custom React hook that manages the state and effects related to the `chatGPTOnly` data.
 * It returns an object containing the `chatGPTOnly` state.
 *
 * @returns The state value for `chatGPTOnly`.
 * @returns {boolean} chatGPTOnly - A boolean indicating whether the user has enabled the `chatGPTOnly` mode.
 */
function useChatGPTOnlyData(){
    const [chatGPTOnly, setChatGPTOnly] = useState(false);

    useEffect(() => {
        // Check if chrome.storage is available
        if(chrome.storage === undefined) return;

        // Get the chatGPTOnly from chrome.storage.local
        chrome.storage.local.get('chatGPTOnly', (data) => {
            console.debug(data) //debug
            setChatGPTOnly(data.chatGPTOnly)
        });

        // Add listener for changes in chatGPTOnly
        const listener = (changes: {[p: string]: chrome.storage.StorageChange}):void => {
            console.debug(changes) //debug
            if (changes.chatGPTOnly) {
                setChatGPTOnly(changes.chatGPTOnly.newValue)
            }
        }
        chrome.storage.onChanged.addListener(listener);

        return () => {
            chrome.storage.onChanged.removeListener(listener);
        }
    }, []);

    return {chatGPTOnly}

}

export {useProxyData, useChatGPTOnlyData}
export type {countryType, providerType, profileType, readOnlyMode, VMDataType}