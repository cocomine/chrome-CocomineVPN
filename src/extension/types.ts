export type ProxyMode = 'whitelist' | 'blacklist';

export interface VMProfile {
  type: string;
  url: string;
}

export interface VMData {
  _id: string;
  _name: string;
  _country: string;
  _expired: string;
  _profiles: VMProfile[];
  _isPowerOn?: boolean;
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
  data: VMData;
}

export interface ConnectResponse {
  type: 'Connect';
  ask: false;
  data: { connected: boolean };
}

export interface PostVMDataMessage {
  type: 'PostVMData';
  ask: boolean;
  data: VMData[];
}

export type ExtensionMessage =
  | ExtensionInstalledRequest
  | ExtensionInstalledResponse
  | ConnectRequest
  | ConnectResponse
  | PostVMDataMessage;

export type RuntimeMessage =
  | { type: 'Connect'; data: VMData }
  | { type: 'Disconnect'; data: VMData };

export interface StoredVmData {
  vmData?: VMData;
}

export interface ProxyFlags {
  chatGPTOnly?: boolean;
  proxyMode?: ProxyMode;
}