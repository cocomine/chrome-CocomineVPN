import type { ExtensionMessage } from './types';

export const postToPage = (message: ExtensionMessage) => {
  window.postMessage(message);
};

export const ensureRuntimeReady = async () => {
  if (!chrome?.runtime?.id) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};
