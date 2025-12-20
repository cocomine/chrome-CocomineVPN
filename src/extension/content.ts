import { ensureRuntimeReady, postToPage } from './shared';
import type { ExtensionMessage, StoredVmData, VMData } from './types';

window.addEventListener('message', async (event: MessageEvent<ExtensionMessage>) => {
  if (event.source !== window) return;
  const message = event.data;
  if (!message?.type) return;

  await ensureRuntimeReady();

  if (message.type === 'ExtensionInstalled' && message.ask) {
    postToPage({ type: 'ExtensionInstalled', ask: false, data: { installed: true, version: chrome.runtime.getManifest().version } });
    return;
  }

  if (message.type === 'Connect' && message.ask) {
    chrome.runtime.sendMessage({ type: 'Connect', data: message.data }, (response) => {
      postToPage({ type: 'Connect', ask: false, data: { connected: Boolean(response?.connected) } });
    });
    return;
  }

  if (message.type === 'PostVMData' && !message.ask) {
    chrome.storage.local.get('vmData', (stored: StoredVmData) => {
      const storedVm = stored.vmData;
      if (!storedVm) return;
      const incomingVm = findVmById(message.data, storedVm._id);
      if (!incomingVm) return;

      if (incomingVm._isPowerOn) {
        chrome.storage.local.set({ vmData: incomingVm });
      } else {
        chrome.runtime.sendMessage({ type: 'Disconnect', data: incomingVm });
      }
    });
  }
});

const findVmById = (list: VMData[], id: string) => list.find((entry) => entry?._id === id);