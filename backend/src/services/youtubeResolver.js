/**
 * YouTube Resolver
 *
 * Tries to match a MusicBrainz track to the most appropriate YouTube video
 * while avoiding fan uploads, covers, remixes, karaoke, etc.
 */

import { searchVideos } from '../providers/youtube/youtubeAdapter.js';
import { parseISO8601Duration } from '../providers/youtube/youtubeNormalizer.js';
import { createTrack, createSource } from '../models/contentModels.js';
import { getCached, setCached } from './cacheService.js';

const RESOLVED_TTL = 30 * 24 * 60 * 60; // 30 days

const NEGATIVE_WORDS = [
  'cover', 'remix', 'remixed', 'karaoke', 'sped up', 'sped-up', 'slowed', 'reverb',
  'nightcore', 'reaction', 'live', 'acoustic', 'instrumental', 'bootleg', 'tribute',
  'fan', '8d', '1 hour', '10 hours', 'bass boosted', 'audio library', 'mashup',
  'medley', 'concert', 'session', 'ft.', 'feat.', 'featuring', 'parody',
];

const POSITIVE_WORDS = [
  'official audio', 'official video', 'official music video', 'audio', 'visualizer',
];

const OFFICIAL_CHANNELS = ['vevo', 'topic', 'official'];

function normalize(str) {
  return (str || '').toLowerCase().trim();
}

function tokenSet(str) {
  return new Set(normalize(str).split(/\s+/).filter(Boolean));
}

function tokensMatch(a, b) {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  let common = 0;
  for (const t of setA) {
    if (setB.has(t)) common++;
  }
  return common / Math.max(setA.size, setB.size);
}

function scoreCandidate(item, track) {
  const title = normalize(item.snippet?.title);
  const channel = normalize(item.snippet?.channelTitle);
  const trackTitle = normalize(track.title);
  const artistName = normalize(track.artist);

  let score = 0;

  // Title matching
  if (title.includes(trackTitle)) {
    score += 120;
  } else {
    const match = tokensMatch(title, trackTitle);
    score += match * 80;
  }

  // Artist in title or channel
  if (title.includes(artistName)) score += 40;
  if (channel.includes(artistName)) score += 80;

  // Official/verified channels
  if (OFFICIAL_CHANNELS.some(word => channel.includes(word))) score += 80;

  // Positive content indicators
  for (const word of POSITIVE_WORDS) {
    if (title.includes(word)) score += 50;
  }

  // View count (capped)
  const viewCount = Number(item.statistics?.viewCount || 0);
  score += Math.min(viewCount / 500000, 40);

  // Duration match
  const ytDuration = parseISO8601Duration(item.contentDetails?.duration);
  if (track.duration && track.duration > 0 && ytDuration > 0) {
    const diff = Math.abs(ytDuration - track.duration);
    if (diff <= 30) score += 30;
    else if (diff <= 90) score += 15;
    else if (ytDuration > track.duration * 2) score -= 30;
  }

  // Negative indicators
  for (const word of NEGATIVE_WORDS) {
    if (title.includes(word)) score -= 100;
    if (channel.includes(word)) score -= 80;
  }

  // Penalize very long videos (mixes, compilations)
  if (ytDuration > 600) score -= 40;

  return score;
}

function pickThumbnail(thumbnails) {
  if (!thumbnails) return null;
  return thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || null;
}

export async function resolveTrackToYouTube(track) {
  if (track.source?.provider === 'youtube') return track;

  const artist = normalize(track.artist);
  const title = normalize(track.title);
  if (!artist || !title) return track;

  const cacheKey = `${artist}:${title}`;
  const cached = await getCached('yt-resolved', cacheKey, 'retroplayer', RESOLVED_TTL);
  if (cached) {
    return createResolvedTrack(track, cached);
  }

  try {
    const data = await searchVideos(`${track.artist} ${track.title}`, 5);
    const results = data.items || [];
    if (results.length === 0) return track;

    const scored = results.map(item => ({
      item,
      score: scoreCandidate(item, track),
    }));

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    if (best.score <= 0) return track;

    const resolved = {
      videoId: best.item.id,
      title: best.item.snippet?.title,
      thumbnail: pickThumbnail(best.item.snippet?.thumbnails),
      channelTitle: best.item.snippet?.channelTitle,
      duration: best.item.contentDetails?.duration,
      viewCount: best.item.statistics?.viewCount,
      score: best.score,
    };

    await setCached('yt-resolved', cacheKey, resolved, 'retroplayer', RESOLVED_TTL);
    return createResolvedTrack(track, resolved);
  } catch {
    return track;
  }
}

function createResolvedTrack(track, resolved) {
  const ytDuration = parseISO8601Duration(resolved.duration);
  return createTrack({
    id: `youtube:${resolved.videoId}`,
    title: track.title,
    artist: track.artist,
    artistId: track.artistId,
    album: track.album,
    albumId: track.albumId,
    duration: ytDuration > 0 ? ytDuration : track.duration,
    image: resolved.thumbnail || track.image,
    viewCount: Number(resolved.viewCount || 0),
    position: track.position,
    discNumber: track.discNumber,
    source: createSource('youtube', resolved.videoId),
  });
}

export async function resolveTracksToYouTube(tracks) {
  const resolved = [];
  for (const track of tracks) {
    const r = await resolveTrackToYouTube(track);
    resolved.push(r);
  }
  return resolved;
}
