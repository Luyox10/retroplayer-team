/**
 * MusicBrainz normalizer
 *
 * Transform MusicBrainz API responses into RetroPlayer models.
 */

import { createArtist, createAlbum, createTrack, createSource, buildContentId } from '../../models/contentModels.js';

export function normalizeArtist(item) {
  if (!item) return null;
  return createArtist({
    id: buildContentId('musicbrainz', item.id),
    name: item.name,
    image: null,
    description: `${item.disambiguation || ''}`.trim() || null,
    subscriberCount: 0,
    genres: [],
    source: createSource('musicbrainz', item.id),
  });
}

function releaseYear(date) {
  if (!date) return null;
  const year = parseInt(date.split('-')[0], 10);
  return Number.isNaN(year) ? null : year;
}

function pickCoverUrl(caaData) {
  if (!caaData?.available || !caaData.images || caaData.images.length === 0) return null;
  const img = caaData.images[0];
  return img?.thumbnails?.['250'] || img?.thumbnails?.small || img?.image || null;
}

function isStudioAlbum(rg) {
  const primary = (rg['primary-type'] || '').toLowerCase();
  const secondary = Array.isArray(rg['secondary-types']) ? rg['secondary-types'].map(s => s.toLowerCase()) : [];
  return primary === 'album' && secondary.length === 0;
}

export function isMainAlbum(rg) {
  const primary = (rg['primary-type'] || '').toLowerCase();
  const secondary = Array.isArray(rg['secondary-types']) ? rg['secondary-types'].map(s => s.toLowerCase()) : [];
  if (primary !== 'album') return false;
  const excluded = ['compilation', 'live', 'soundtrack', 'dj-mix', 'remix', 'mixtape', 'demo'];
  return !secondary.some(s => excluded.includes(s));
}

export function normalizeAlbum(rg, artist, caaData, releaseData = null) {
  if (!rg) return null;
  const firstRelease = releaseData?.releases?.[0];
  const trackCount = firstRelease
    ? (firstRelease['medium-track-count'] || firstRelease.media?.reduce((sum, m) => sum + (m.tracks?.length || 0), 0) || null)
    : null;

  return createAlbum({
    id: buildContentId('musicbrainz', rg.id),
    name: rg.title,
    artistId: artist ? buildContentId('musicbrainz', artist.id) : null,
    artistName: artist ? artist.name : null,
    year: releaseYear(rg['first-release-date']),
    trackCount,
    image: pickCoverUrl(caaData),
    source: createSource('musicbrainz', rg.id),
  });
}

export function normalizeTracks(releaseData, album, artist) {
  if (!releaseData?.media) return [];
  const tracks = [];
  for (const media of releaseData.media) {
    const discNumber = media.position || 1;
    for (const t of media.tracks || []) {
      const lengthMs = t.length || t.recording?.length;
      tracks.push(createTrack({
        id: buildContentId('musicbrainz', t.recording?.id || t.id),
        title: t.title,
        artist: artist ? artist.name : (t['artist-credit']?.[0]?.name || null),
        artistId: artist?.id ? buildContentId('musicbrainz', artist.id) : null,
        album: album ? album.name : null,
        albumId: album ? album.id : null,
        duration: lengthMs ? Math.round(lengthMs / 1000) : 0,
        image: album ? album.image : null,
        viewCount: 0,
        position: t.position,
        source: createSource('musicbrainz', t.recording?.id || t.id),
      }));
    }
  }
  return tracks;
}

export function sortByDateAsc(groups) {
  return [...groups].sort((a, b) => {
    const ya = a['first-release-date'] || '';
    const yb = b['first-release-date'] || '';
    if (ya === yb) return 0;
    return ya > yb ? 1 : -1;
  });
}
