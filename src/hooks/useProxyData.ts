import {useEffect, useState} from "react";
import {VMCountryType, VMInstanceDataType} from "../extension/types";
import ChromeSettingOnChangeDetails = chrome.types.ChromeSettingOnChangeDetails;
import ProxyConfig = chrome.proxy.ProxyConfig;

/**
 * `useProxyData` is a custom React hook that manages the state and effects related to proxy data.
 * It returns an object containing the connection status, country code, and VM data.
 *
 * @returns The state values for connected, country, and vmData.
 * @returns {boolean} connected - A boolean indicating whether the user is connected to vpn.cocomine.cc.
 * @returns {VMCountryType | null} country - The country code of the VPN server, or null if not connected.
 * @returns {VMInstanceDataType | null} vmData - The VM data retrieved from chrome.storage.local, or null if not available.
 */
export default function useProxyData() {
    const [connected, setConnected] = useState(false);
    const [country, setCountry] = useState<VMCountryType | null>(null);
    const [vmData, setVmData] = useState<VMInstanceDataType | null>(null);

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
        const listener = (details:  ChromeSettingOnChangeDetails<ProxyConfig>):void => {
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
        chrome.storage.local.get<{ vmData: VMInstanceDataType }>('vmData', (data) => {
            console.debug(data) //debug
            setVmData(data.vmData ?? null)
            setCountry(data.vmData?._country || null)
        });

        // Add listener for changes in vmData
        const listener = (changes: {[p: string]: chrome.storage.StorageChange}):void => {
            console.debug(changes) //debug
            if (changes.vmData) {
                const nextVmData = changes.vmData.newValue as VMInstanceDataType | undefined;
                setVmData(nextVmData ?? null)
                setCountry(nextVmData?._country || null);
            }
        }
        chrome.storage.onChanged.addListener(listener);

        return () => {
            chrome.storage.onChanged.removeListener(listener);
        }
    }, []);

    return {connected, country, vmData}
}