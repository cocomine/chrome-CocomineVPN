import type {ProxyFlags, ProxyMode, VMInstanceDataType} from './types';

export interface ProxyConfigResult {
    config: chrome.proxy.ProxyConfig;
    vmData: VMInstanceDataType;
    cleanup?: () => void;
}

export const createProxyConfig = (vmData: VMInstanceDataType): Promise<ProxyConfigResult> => {
    return new Promise(async (resolve) => {
        const flags = await chrome.storage.local.get<ProxyFlags>(['chatGPTOnly', 'proxyMode']);

        // Custom PAC for whitelist or blacklist modes
        const proxyMode = flags.proxyMode;
        if (proxyMode === 'whitelist' || proxyMode === 'blacklist') {
            const lists = await chrome.storage.sync.get<Record<string, string[]>>(proxyMode); // Get whitelist/blacklist from sync storage
            const urls = lists?.[proxyMode] || []; // Default to empty array if not found; list.whitelist or list.blacklist
            resolve({
                config: {
                    mode: 'pac_script',
                    pacScript: {data: createCustomPac(vmData, proxyMode, urls)},
                },
                vmData,
            });
            return;
        }

        // ChatGPT only PAC script
        if (flags.chatGPTOnly) {
            resolve({
                config: {
                    mode: 'pac_script',
                    pacScript: {data: createChatGPTPac(vmData)},
                },
                vmData,
            });
            return;
        }

        // Default to fixed SOCKS5 proxy
        const profile = vmData._profiles.find((p) => p.type === 'socks5');
        if (!(profile && profile.url)) {
            // No SOCKS5 profile found, use direct connection
            resolve({config: {mode: 'direct'}, vmData});
            return;
        }

        // Extract host and port from profile URL
        const [host, port] = profile.url.split(':');
        resolve({
            config: {
                mode: 'fixed_servers',
                rules: {singleProxy: {scheme: 'socks5', host, port: parseInt(port, 10)}},
            },
            vmData,
        });
    });
};

// create a PAC script that routes traffic through the SOCKS5 proxy for ChatGPT related domains
const createChatGPTPac = (vm: VMInstanceDataType) => {
    // find the SOCKS5 profile
    const profile = vm._profiles.find((p) => p.type === 'socks5');
    if (!profile) return '';

    // return the PAC script
    return `
    function FindProxyForURL(url, host){
        if (dnsDomainIs(host, "openai.com") || dnsDomainIs(host, "chatgpt.com") || dnsDomainIs(host, "api.cocomine.cc") || dnsDomainIs(host, "sora.com")){
            return "SOCKS5 ${profile.url}";
        }
        return "DIRECT";
    }`.replace(/\n/g, '');
};

// create a PAC script that routes traffic through the SOCKS5 proxy for custom url list
const createCustomPac = (vm: VMInstanceDataType, mode: ProxyMode, urls: string[]) => {
    const profile = vm._profiles.find((p) => p.type === 'socks5'); // Find the SOCKS5 profile
    if (!profile) return ''; // Return empty string if no SOCKS5 profile found

    // Create condition based on mode
    const condition =
        mode === 'whitelist'
            ? urls.map((domain) => `shExpMatch(host, "${domain}")`).join(' || ')
            : urls.map((domain) => `!shExpMatch(host, "${domain}")`).join(' && ');

    // Return the PAC script
    return `
    function FindProxyForURL(url, host){
        if (dnsDomainIs(host, "api.cocomine.cc") || ${condition}){
            return "SOCKS5 ${profile.url}";
        }
        return "DIRECT";
    }`.replace(/\n/g, '');
};