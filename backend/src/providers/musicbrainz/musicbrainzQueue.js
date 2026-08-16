/**
 * MusicBrainz request queue
 *
 * MusicBrainz limits requests to ~1 per second.
 * All requests to musicbrainz.org MUST go through this queue.
 * The queue is shared globally across the process.
 */

const MIN_DELAY_MS = 1100;

let lastRequestTime = 0;
let pending = Promise.resolve();

export async function enqueue(fn) {
  const run = async () => {
    const now = Date.now();
    const wait = Math.max(0, MIN_DELAY_MS - (now - lastRequestTime));
    if (wait > 0) {
      await new Promise(r => setTimeout(r, wait));
    }
    lastRequestTime = Date.now();
    return fn();
  };

  const result = pending.then(run, run);
  pending = result.catch(() => {});
  return result;
}
