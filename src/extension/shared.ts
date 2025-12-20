import type { ExtensionMessage } from './types';

/**
 * Post a message to the web page.
 * @param message - The message to post.
 */
export const postToPage = (message: ExtensionMessage) => {
  window.postMessage(message);
};

/**
 * Ensure that the Chrome runtime is ready before proceeding.
 * This function checks if `chrome.runtime.id` is available,
 * and if not, it waits briefly before resolving.
 */
export const ensureRuntimeReady = async () => {
  if (!chrome?.runtime?.id) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};
