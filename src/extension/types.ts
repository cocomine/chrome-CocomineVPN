export type ProxyMode = 'whitelist' | 'blacklist';

/**
 * Type definition for the country.
 */
export type VMCountryType = "TW" | "JP" | "US" | "HK" | "UK" | string

/**
 * Type definition for the provider.
 * @typedef {("google" | "azure")} VMProviderType
 */
export type VMProviderType = "google" | "azure"

/**
 * Type definition for the profile.
 * @typedef {Object} VPNProfileType
 * @property {("OpenVPN" | "SoftEther" | "SS" | "socks5")} type - The type of the profile.
 * @property {string} name - The name of the profile.
 * @property {string} filename - The filename of the profile.
 * @property {string} [url] - The url of the profile.
 */
export type VPNProfileType = {
  "type": "OpenVPN" | "SoftEther" | "SS" | "socks5",
  "name": string,
  "filename": string,
  "url"?: string
}

/**
 * Type definition for the read only mode.
 * @typedef {("startOnly" | "stopOnly" | "readOnly" | "disable")} ReadOnlyModeType
 */
export type ReadOnlyModeType = "startOnly" | "stopOnly" | "readOnly" | "disable"

/**
 * Type definition for the VM Instance data.
 * @typedef {Object} VMInstanceDataType
 * @property {string} _name - The name of the VM.
 * @property {string} _status - The status of the VM.
 * @property {string} _id - The id of the VM.
 * @property {string} _zone - The zone of the VM.
 * @property {string} _url - The url of the VM.
 * @property {VMCountryType} _country - The country of the VM.
 * @property {VPNProfileType[]} _profiles - The profiles of the VM.
 * @property {VMProviderType} _provider - The provider of the VM.
 * @property {boolean} _isPowerOn - The power status of the VM.
 * @property {ReadOnlyModeType} _readonly - The read only mode of the VM.
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

export interface ExtensionInstalledRequest {
  type: 'ExtensionInstalled';
  ask: true;
  data?: undefined;
}

export interface ExtensionInstalledResponse {
  type: 'ExtensionInstalled';
  ask: false;
  data: { installed: boolean; version: string };
}

export interface ConnectRequest {
  type: 'Connect';
  ask: true;
  data: VMInstanceDataType;
}

export interface ConnectResponse {
  type: 'Connect';
  ask: false;
  data: { connected: boolean };
}

export interface PostVMDataMessage {
  type: 'PostVMData';
  ask: boolean;
  data: VMInstanceDataType[];
}

export type ExtensionMessage =
  | ExtensionInstalledRequest
  | ExtensionInstalledResponse
  | ConnectRequest
  | ConnectResponse
  | PostVMDataMessage;

export type RuntimeMessage =
  | { type: 'Connect' | 'Disconnect' | 'AlarmsUpdate'; data: VMInstanceDataType }

export interface StoredVmData {
  vmData?: VMInstanceDataType;
}

export interface ProxyFlags {
  chatGPTOnly?: boolean;
  proxyMode?: ProxyMode;
}