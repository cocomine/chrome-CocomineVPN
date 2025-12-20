export const createProxyConfig = (vmData) => {
    return new Promise((resolve) => {
        chrome.storage.local.get(['chatGPTOnly', 'proxyMode'], (flags) => {
            const proxyMode = flags.proxyMode;
            if (proxyMode === 'whitelist' || proxyMode === 'blacklist') {
                chrome.storage.sync.get(proxyMode, (lists) => {
                    const urls = lists?.[proxyMode] || [];
                    resolve({
                        config: {
                            mode: 'pac_script',
                            pacScript: { data: createCustomPac(vmData, proxyMode, urls) },
                        },
                        vmData,
                    });
                });
                return;
            }
            if (flags.chatGPTOnly) {
                resolve({
                    config: {
                        mode: 'pac_script',
                        pacScript: { data: createChatGPTPac(vmData) },
                    },
                    vmData,
                });
                return;
            }
            const profile = vmData._profiles.find((p) => p.type === 'socks5');
            if (!profile) {
                resolve({ config: { mode: 'direct' }, vmData });
                return;
            }
            const [host, port] = profile.url.split(':');
            resolve({
                config: {
                    mode: 'fixed_servers',
                    rules: { singleProxy: { scheme: 'socks5', host, port: parseInt(port, 10) } },
                },
                vmData,
            });
        });
    });
};
const createChatGPTPac = (vm) => {
    const profile = vm._profiles.find((p) => p.type === 'socks5');
    if (!profile)
        return '';
    return `function FindProxyForURL(url, host){
    if (dnsDomainIs(host, "openai.com") || dnsDomainIs(host, "chatgpt.com") || dnsDomainIs(host, "api.cocomine.cc") || dnsDomainIs(host, "sora.com")){
      return "SOCKS5 ${profile.url}";
    }
    return "DIRECT";
  }`.replace(/\n/g, '');
};
const createCustomPac = (vm, mode, urls) => {
    const profile = vm._profiles.find((p) => p.type === 'socks5');
    if (!profile)
        return '';
    const condition = mode === 'whitelist'
        ? urls.map((domain) => `shExpMatch(host, "${domain}")`).join(' || ')
        : urls.map((domain) => `!shExpMatch(host, "${domain}")`).join(' && ');
    return `function FindProxyForURL(url, host){
    if (dnsDomainIs(host, "api.cocomine.cc") || ${condition}){
      return "SOCKS5 ${profile.url}";
    }
    return "DIRECT";
  }`.replace(/\n/g, '');
};
