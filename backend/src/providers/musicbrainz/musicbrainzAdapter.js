/**
 * MusicBrainz adapter
 *
 * Low-level HTTP calls to MusicBrainz and Cover Art Archive.
 * All musicbrainz.org requests go through the shared queue.
 */

import { enqueue } from './musicbrainzQueue.js';
import { getCached, setCached } from '../../services/cacheService.js';

const MB_BASE = 'https://musicbrainz.org/ws/2';
const CAA_BASE = 'https://coverartarchive.org';
const MB_HEADERS = {
  'User-Agent': 'RetroPlayer/0.1 (contact@retroplayer.app)',
  Accept: 'application/json',
};

const SEARCH_TTL = 30 * 24 * 60 * 60; // 30 days
const RG_TTL = 30 * 24 * 60 * 60;
const RELEASE_TTL = 30 * 24 * 60 * 60;
const TRACKLIST_TTL = 30 * 24 * 60 * 60;

async function cachedMbFetch(cacheType, cacheKey, url, ttl = SEARCH_TTL) {
  const cached = await getCached(`musicbrainz:${cacheType}`, cacheKey, 'musicbrainz', ttl);
  if (cached) return cached;

  const data = await enqueue(async () => {
    const res = await fetch(url, { headers: MB_HEADERS });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`MusicBrainz ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  });

  await setCached(`musicbrainz:${cacheType}`, cacheKey, data, 'musicbrainz', ttl);
  return data;
}

export async function searchArtist(name) {
  const cacheKey = name.toLowerCase().trim();
  const url = `${MB_BASE}/artist/?query=artist:"${encodeURIComponent(name)}"&fmt=json&limit=5`;
  return cachedMbFetch('search', cacheKey, url, SEARCH_TTL);
}

export async function getArtistReleaseGroups(artistMbid) {
  const url = `${MB_BASE}/release-group/?artist=${encodeURIComponent(artistMbid)}&fmt=json&limit=100`;
  return cachedMbFetch('release-groups', artistMbid, url, RG_TTL);
}

export async function getFirstReleaseForGroup(releaseGroupMbid) {
  const url = `${MB_BASE}/release/?release-group=${encodeURIComponent(releaseGroupMbid)}&fmt=json&limit=1`;
  return cachedMbFetch('release', releaseGroupMbid, url, RELEASE_TTL);
}

export async function getReleaseTracklist(releaseMbid) {
  const url = `${MB_BASE}/release/${encodeURIComponent(releaseMbid)}/?inc=recordings+release-groups&fmt=json`;
  return cachedMbFetch('tracklist', releaseMbid, url, TRACKLIST_TTL);
}

export async function getCoverArtForReleaseGroup(releaseGroupMbid) {
  const cached = await getCached('musicbrainz:cover', releaseGroupMbid, 'musicbrainz', 30 * 24 * 60 * 60);
  if (cached) return cached;

  try {
    const res = await fetch(`${CAA_BASE}/release-group/${encodeURIComponent(releaseGroupMbid)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      const data = { available: false, status: res.status };
      await setCached('musicbrainz:cover', releaseGroupMbid, data, 'musicbrainz', 30 * 24 * 60 * 60);
      return data;
    }
    const data = { available: true, ...(await res.json()) };
    await setCached('musicbrainz:cover', releaseGroupMbid, data, 'musicbrainz', 30 * 24 * 60 * 60);
    return data;
  } catch (err) {
    const data = { available: false, error: err.message };
    await setCached('musicbrainz:cover', releaseGroupMbid, data, 'musicbrainz', 30 * 24 * 60 * 60);
    return data;
  }
}
