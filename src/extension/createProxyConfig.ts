import type {ProxyConfigResult, ProxyFlags, ProxyMode, VMInstanceDataType} from './types';

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

        // Default to fixed HTTPS proxy
        const profile = vmData._profiles.find((p) => p.type === 'https');
        if (!profile || profile.type !== 'https') {
            // No HTTPS profile found, use direct connection
            resolve({config: {mode: 'direct'}, vmData});
            return;
        }

        // Extract host and port from profile URL
        const [host, port] = profile.url.split(':');
        resolve({
            config: {
                mode: 'fixed_servers',
                rules: {singleProxy: {scheme: 'https', host, port: parseInt(port, 10)}},
            },
            vmData,
        });
    });
};

// create a PAC script that routes traffic through the HTTPS proxy for ChatGPT related domains
const createChatGPTPac = (vm: VMInstanceDataType) => {
    // find the HTTPS profile
    const profile = vm._profiles.find((p) => p.type === 'https');
    if (!profile || profile.type !== 'https') return 'function FindProxyForURL(url, host){return "DIRECT"}';

    // return the PAC script
    return `
    function FindProxyForURL(url, host){
        if (dnsDomainIs(host, "openai.com") || dnsDomainIs(host, "chatgpt.com") || dnsDomainIs(host, "api.cocomine.cc") || dnsDomainIs(host, "sora.com")){
            return "HTTPS ${profile.url}";
        }
        return "DIRECT";
    }`.replace(/\n/g, '');
};

// create a PAC script that routes traffic through the HTTPS proxy for custom url list
const createCustomPac = (vm: VMInstanceDataType, mode: ProxyMode, urls: string[]) => {
    const profile = vm._profiles.find((p) => p.type === 'https'); // Find the HTTPS profile
    if (!profile || profile.type !== 'https') return 'function FindProxyForURL(url, host){return "DIRECT"}'; // Return empty string if no HTTPS profile found

    // Create condition based on mode
    const condition =
        mode === 'whitelist'
            ? urls.map((domain) => `shExpMatch(host, "${domain}")`).join(' || ')
            : urls.map((domain) => `!shExpMatch(host, "${domain}")`).join(' && ');

    // Return the PAC script
    return `
    function FindProxyForURL(url, host){
        if (dnsDomainIs(host, "api.cocomine.cc") || ${condition}){
            return "HTTPS ${profile.url}";
        }
        return "DIRECT";
    }`.replace(/\n/g, '');
};