import type {RuntimeMessage, StoredVmData} from './types';
import {createProxyConfig} from "./createProxyConfig.js";

const API_URL = 'https://api.cocomine.cc'; // API endpoint, in this time is only for ping test
let pingInterval: number | undefined; // To hold the interval ID for pinging

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.tabs.create({ url: 'https://github.com/cocomine/chrome-vpn/blob/master/README.md' });
  } else if (reason === 'update') {
    chrome.tabs.create({ url: 'https://github.com/cocomine/chrome-vpn/blob/master/README.md#118' });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'offline-time-check') return;
  chrome.storage.local.get('vmData', (data: StoredVmData) => {
    const vm = data.vmData;
    if (!vm) return;
    const expiresAt = new Date(vm._expired).getTime();
    if (expiresAt - Date.now() >= 60 * 60 * 1000) return;

    chrome.notifications.clear('offlineTimeNotify');
    chrome.notifications.create('offlineTimeNotify', {
      type: 'basic',
      iconUrl: 'icon-128.png',
      title: 'VPN節點即將關閉',
      message: `${vm._country}(${vm._name}) VPN節點即將30分鐘內關閉。如有需要請點擊延長開放時間。`,
      buttons: [{ title: '延長開放時間' }],
    });

    chrome.alarms.clear('offline-time-check');
  });
});

chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId !== 'offlineTimeNotify') return;
  chrome.storage.local.get('vmData', (data: StoredVmData) => {
    const vm = data.vmData;
    if (!vm) return;
    chrome.tabs.create({ url: `https://vpn.cocomine.cc/${vm._id}#extendTime` });
  });
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId !== 'offlineTimeNotify' || buttonIndex !== 0) return;
  chrome.storage.local.get('vmData', (data: StoredVmData) => {
    const vm = data.vmData;
    if (!vm) return;
    chrome.tabs.create({ url: `https://vpn.cocomine.cc/${vm._id}#extendTime` });
  });
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
  if (message.type === 'Connect') {
    createProxyConfig(message.data).then(({ config, vmData, cleanup }) => {
      chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
        if (cleanup) cleanup();
        pingInterval && clearInterval(pingInterval);
        pingInterval = window.setInterval(() => {
          fetch(`${API_URL}/ping`, { headers: { 'Content-Type': 'application/json' } })
            .then((response) => {
              if (!response.ok) throw new Error('Ping failed');
              clearInterval(pingInterval);
              chrome.storage.local.set({ vmData });
              chrome.notifications.clear('connectedNotify');
              chrome.notifications.create('connectedNotify', {
                type: 'basic',
                iconUrl: 'icon-128.png',
                title: '成功連接',
                message: '已成功連接到節點!',
              });
              chrome.alarms.clearAll();
              const expiresAt = new Date(vmData._expired).getTime();
              chrome.alarms.create('offline-time-check', { periodInMinutes: 15, when: expiresAt - 60 * 60 * 1000 });
              sendResponse({ connected: true });
            })
            .catch(() => {
              sendResponse({ connected: false });
            });
        }, 1000);
      });
    });
    return true;
  }

  if (message.type === 'Disconnect') {
    chrome.proxy.settings.clear({}, () => {
      chrome.storage.local.remove('vmData');
      chrome.notifications.clear('disconnectedNotify');
      chrome.notifications.create('disconnectedNotify', {
        type: 'basic',
        iconUrl: 'icon-128.png',
        title: '已斷開連接',
        message: '已成功斷開與節點的連接!',
      });
      chrome.alarms.clearAll();
      sendResponse({ connected: false });
    });
    return true;
  }
  return false;
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get('vmData', (data: StoredVmData) => {
    const vm = data.vmData;
    if (!vm) return;
    if (new Date(vm._expired).getTime() >= Date.now()) return;
    chrome.proxy.settings.clear({}, () => chrome.storage.local.remove('vmData'));
  });
});