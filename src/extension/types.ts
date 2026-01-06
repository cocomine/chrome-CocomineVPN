import {PropsWithChildren} from "react";

/**
 * Module: Type Definitions
 * This file contains TypeScript type definitions related to the extension frontend
 * and runtime, VM data structures, UI component props, storage shapes, and messaging.
 */

/**
 * Proxy mode for custom proxy rules.
 * - `whitelist`: only allow URLs in the whitelist to go through proxy
 * - `blacklist`: block URLs in the blacklist from proxy
 * - `disable`: disable custom proxy rules
 */
export type ProxyMode = 'whitelist' | 'blacklist' | 'disable';

/**
 * Props for the DynamicText React component.
 *
 * Extends React's PropsWithChildren so children can be passed.
 *
 * @interface DynamicTextProps
 * @extends PropsWithChildren
 * @property {string} [defaultFontSize] - Optional default font size (e.g. "14px", "1rem").
 */
export interface DynamicTextProps extends PropsWithChildren {
    defaultFontSize?: string;
}

/**
 * VM country code type.
 * Common short codes are provided, but any string is allowed to support extensions.
 */
export type VMCountryType = "TW" | "JP" | "US" | "HK" | "UK" | string

/**
 * VM provider type.
 * Enumerates supported VM/cloud providers.
 */
export type VMProviderType = "google" | "azure"

/**
 * VPN profile representation.
 *
 * @property {"OpenVPN" | "SoftEther" | "SS" | "socks5"} type - Profile transport/type.
 * @property {string} name - Human readable profile name.
 * @property {string} filename - Local filename associated with the profile.
 * @property {string} [url] - Optional remote URL where profile can be downloaded.
 */
export type VPNProfileType = {
    "type": "OpenVPN" | "SoftEther" | "SS" | "socks5",
    "name": string,
    "filename": string,
    "url"?: string
}

/**
 * Read-only mode controls UI action availability.
 * - `startOnly`: only allow start action
 * - `stopOnly`: only allow stop action
 * - `readOnly`: all actions are disabled (read-only)
 * - `disable`: do not apply read-only restrictions
 */
export type ReadOnlyModeType = "startOnly" | "stopOnly" | "readOnly" | "disable"

/**
 * VM instance data shape used across UI and runtime messaging.
 *
 * Fields marked with the `readonly` modifier should not be mutated after creation.
 *
 * @property {string} _name - Display name of the VM.
 * @property {string} _status - Current VM status (e.g. "running", "stopped").
 * @property {string} _id - Unique VM identifier.
 * @property {string} _zone - Zone or region where VM is located.
 * @property {string} _url - Access URL for VM.
 * @property {VMCountryType} _country - Country/region code for VM.
 * @property {VPNProfileType[]} _profiles - Array of associated VPN profiles.
 * @property {VMProviderType} _provider - Cloud/provider for the VM.
 * @property {boolean} _isPowerOn - Whether the VM is powered on.
 * @property {ReadOnlyModeType} _readonly - Readonly mode for the VM controls.
 * @property {string | null} _expired - Optional expiration timestamp or null if not set.
 */
export type VMInstanceDataType = {
    readonly _name: string;
    _status: string;
    readonly _id: string;
    readonly _zone: string;
    readonly _url: string;
    readonly _country: VMCountryType;
    readonly _profiles: VPNProfileType[];
    readonly _provider: VMProviderType;
    _isPowerOn: boolean;
    readonly _readonly: ReadOnlyModeType;
    _expired: string | null;
}

/**
 * Tracked VPN usage data shape.
 *
 * @property datetime - Timestamp of the tracking event.
 * @property country - Country/region code associated with the event.
 * @property target - True if connecting, false if disconnecting.
 */
export type trackDataType = {
    datetime: string;
    country: VMCountryType;
    target: boolean;
}

/**
 * Message asking the extension whether the extension is installed.
 *
 * Sent from the UI to the extension runtime to query installation state.
 */
export interface ExtensionInstalledRequest {
    type: 'ExtensionInstalled';
    ask: true;
    data?: undefined;
}

/**
 * Response indicating whether the extension is installed and its version.
 */
export interface ExtensionInstalledResponse {
    type: 'ExtensionInstalled';
    ask: false;
    data: { installed: boolean; version: string };
}

/**
 * Request to connect to a VM instance.
 *
 * Contains the VM instance data to be used by the runtime for initiating connection.
 */
export interface ConnectRequest {
    type: 'Connect';
    ask: true;
    data: VMInstanceDataType;
}

/**
 * Response to a connect request indicating success or failure.
 */
export interface ConnectResponse {
    type: 'Connect';
    ask: false;
    data: { connected: boolean };
}

/**
 * Message publishing one or more VM instances to the extension.
 *
 * Commonly used to sync available VMs from runtime to the extension.
 */
export interface PostVMDataMessage {
    type: 'PostVMData';
    ask: boolean;
    data: VMInstanceDataType[];
}

/**
 * Message for retrieving tracked VPN usage data.
 *
 * Sent from the UI to the extension runtime to request tracked usage information.
 */
export interface RetrieveTrackedUsageMessage {
    type: 'RetrieveTrackedUsage';
    ask: boolean;
    data: trackDataType[];
}

/**
 * Union of extension <-> host messages handled by the UI/extension runtime bridge.
 */
export type ExtensionMessage =
    | ExtensionInstalledRequest
    | ExtensionInstalledResponse
    | ConnectRequest
    | ConnectResponse
    | PostVMDataMessage
    | RetrieveTrackedUsageMessage;

/**
 * Runtime-origin messages representing VM events or updates.
 */
export type RuntimeMessage =
    | { type: 'Connect' | 'Disconnect' | 'AlarmsUpdate'; data: VMInstanceDataType }

/**
 * Shape stored in persistent storage for VM-related data.
 */
export interface StoredVmData {
    vmData?: VMInstanceDataType;
}

/**
 * Shape stored in persistent storage for tracked VPN usage data.
 */
export interface StoredTrackData {
    trackData?: trackDataType[];
}

/**
 * Flags related to proxy behavior.
 *
 * - chatGPTOnly: if true, proxy rules apply only to ChatGPT traffic.
 * - proxyMode: current proxy mode (whitelist/blacklist/disable).
 */
export interface ProxyFlags {
    chatGPTOnly?: boolean;
    proxyMode?: ProxyMode;
}

/**
 * Interface for the properties of the AddURLModal component.
 *
 * @property {boolean} show - Indicates whether the modal is visible.
 * @property {function} onHide - Callback function to handle hiding the modal.
 * @property {string} url - The URL to be added.
 */
export interface AddURLModalProps {
    show: boolean;
    onHide: () => void;
    url: string;
}

/**
 * Interface for the properties of the URLSelector component.
 *
 * @property {string} value - The current value of the URL selector.
 * @property {function} onSelect - Callback function to handle the selection of a URL.
 * @property {function} [onHover] - Optional callback function to handle hovering over a URL.
 */
export interface URLSelectorProps {
    value: string;
    onSelect: (value: string) => void;
    onHover?: (value: string | null) => void;
}

/**
 * Visual mask type for blacklist/whitelist UI overlays.
 * Supports explicit 'black' or 'transparent' values, or `rgba(0,0,0,N)` with a numeric alpha.
 */
export type MaskType = 'black' | 'transparent' | `rgba(0,0,0,${number})`

/**
 * Storage shape for whitelist/blacklist URL arrays.
 *
 * Uses Partial and Record to store lists for modes excluding `disable`.
 * Keys are 'whitelist' | 'blacklist' and values are arrays of URL strings.
 */
export type StorageLists = Partial<Record<Exclude<ProxyMode, 'disable'>, string[]>>;