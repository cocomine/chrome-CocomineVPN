export const postToPage = (message) => {
    window.postMessage(message);
};
export const ensureRuntimeReady = async () => {
    if (!chrome?.runtime?.id) {
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
};
