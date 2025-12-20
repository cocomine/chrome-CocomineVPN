import type { ProxyFlags, ProxyMode, VMData } from './types';

export interface ProxyConfigResult {
  config: chrome.proxy.ProxyConfig;
  vmData: VMData;
  cleanup?: () => void;
}

export const createProxyConfig = (vmData: VMData): Promise<ProxyConfigResult> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['chatGPTOnly', 'proxyMode'], (flags: ProxyFlags) => {
      const proxyMode = flags.proxyMode;
      if (proxyMode === 'whitelist' || proxyMode === 'blacklist') {
        chrome.storage.sync.get(proxyMode, (lists: Record<string, string[]>) => {
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

const createChatGPTPac = (vm: VMData) => {
  const profile = vm._profiles.find((p) => p.type === 'socks5');
  if (!profile) return '';
  return `function FindProxyForURL(url, host){
    if (dnsDomainIs(host, "openai.com") || dnsDomainIs(host, "chatgpt.com") || dnsDomainIs(host, "api.cocomine.cc") || dnsDomainIs(host, "sora.com")){
      return "SOCKS5 ${profile.url}";
    }
    return "DIRECT";
  }`.replace(/\n/g, '');
};

const createCustomPac = (vm: VMData, mode: ProxyMode, urls: string[]) => {
  const profile = vm._profiles.find((p) => p.type === 'socks5');
  if (!profile) return '';
  const condition =
    mode === 'whitelist'
      ? urls.map((domain) => `shExpMatch(host, "${domain}")`).join(' || ')
      : urls.map((domain) => `!shExpMatch(host, "${domain}")`).join(' && ');
  return `function FindProxyForURL(url, host){
    if (dnsDomainIs(host, "api.cocomine.cc") || ${condition}){
      return "SOCKS5 ${profile.url}";
    }
    return "DIRECT";
  }`.replace(/\n/g, '');
};