import type {ExtensionMessage, StoredTrackData, TrackDataType, VMInstanceDataType} from './types';

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

/**
 * Note: New skill!!
 * Queue used to serialize updates to the `trackData` array in chrome.storage.local.
 * This avoids race conditions from concurrent read-modify-write sequences.
 */
let trackDataUpdateQueue: Promise<void> = Promise.resolve();

/**
 * Enqueue an update to the `trackData` array so that all updates
 * are applied sequentially and no events are lost.
 */
const enqueueTrackDataUpdate = async (entry: TrackDataType) => {
    /**
     * Chain the new update onto the existing queue
     * Each update reads the current data, appends the new entry, and writes it back
     * When promise resolves, the next update in the queue can proceed
     * When promise still pending, new updates will wait their turn
     */
    trackDataUpdateQueue = trackDataUpdateQueue.then(async () => {
        const stored = await chrome.storage.local.get<StoredTrackData>('trackData');
        const trackData = stored.trackData || [];
        trackData.push(entry);
        await chrome.storage.local.set({ trackData });
    }).catch((error) => {
        console.error('Failed to update trackData in chrome.storage.local:', error);
    });
    return trackDataUpdateQueue;
};

/**
 * Log a connect track event.
 * @param data - The VM instance data.
 * @param datetime - Connect datetime (optional, defaults to now).
 */
export const logConnectTrack = async (data: VMInstanceDataType, datetime = new Date()) => {
    const entry = {
        datetime: datetime.toISOString(),
        country: data._country,
        isConnect: true
    };
    await enqueueTrackDataUpdate(entry);
}

/**
 * Log a disconnect track event.
 * @param data - The VM instance data.
 * @param datetime - The disconnect datetime (optional, defaults to now).
 */
export const logDisconnectTrack = async (data: VMInstanceDataType, datetime = new Date()) => {
    // If an expiration time is set and is earlier than now, use that as the disconnect time
    if(data._expired){
        const tmp = new Date(data._expired);
        datetime = tmp.getTime() < datetime.getTime() ? tmp : datetime;
    }

    const entry = {
        datetime: datetime.toISOString(),
        country: data._country,
        isConnect: false
    };
    await enqueueTrackDataUpdate(entry);
}
