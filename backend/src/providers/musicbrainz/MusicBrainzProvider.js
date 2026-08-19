import { ContentProvider } from '../ContentProvider.js';
import * as adapter from './musicbrainzAdapter.js';
import { normalizeArtist, normalizeAlbum, normalizeTracks, isMainAlbum, sortByDateAsc } from './musicbrainzNormalizer.js';
import { buildContentId, createSource } from '../../models/contentModels.js';
import { resolveTracksToYouTube } from '../../services/youtubeResolver.js';
import { AppError } from '../../utils/errors.js';

function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export class MusicBrainzProvider extends ContentProvider {
  get name() {
    return 'musicbrainz';
  }

  /**
   * Search for an artist by name and select the best candidate.
   */
  async resolveArtist(name) {
    const data = await adapter.searchArtist(name);
    const candidates = data?.artists || [];
    if (candidates.length === 0) {
      throw new AppError('Artist not found on MusicBrainz', 404, 'NOT_FOUND');
    }

    const queryNorm = normalizeName(name);
    const filtered = candidates.filter(a => a.type === 'Person' || a.type === 'Group');
    const ranked = filtered.map(a => {
      const norm = normalizeName(a.name);
      return {
        ...a,
        exact: norm === queryNorm ? 1 : 0,
        contains: norm.includes(queryNorm) ? 1 : 0,
      };
    }).sort((a, b) => (b.contains - a.contains) || (b.exact - a.exact) || ((b.score || 0) - (a.score || 0)));
    const selected = ranked[0] || candidates[0];

    return {
      mbid: selected.id,
      name: selected.name,
      type: selected.type,
      country: selected.country,
      area: selected.area?.name,
      disambiguation: selected.disambiguation,
      score: selected.score,
    };
  }

  /**
   * Get a MusicBrainz artist by MBID.
   */
  async getArtist(externalId) {
    // External ID is an MBID for this provider
    return normalizeArtist({
      id: externalId,
      name: 'MusicBrainz artist',
      type: 'Artist',
    });
  }

  /**
   * Get discography for an artist by name.
   * Returns { artist, albums } where albums are studio release groups.
   */
  async getDiscography(artistName, limit = 10) {
    const artist = await this.resolveArtist(artistName);
    const rgData = await adapter.getArtistReleaseGroups(artist.mbid);
    const groups = rgData?.['release-groups'] || [];

    const mainGroups = sortByDateAsc(groups.filter(isMainAlbum)).slice(0, limit);

    const albums = mainGroups
      .map(rg => normalizeAlbum(rg, artist, null, null))
      .filter(Boolean);

    return {
      artist: normalizeArtist({
        id: artist.mbid,
        name: artist.name,
        type: artist.type,
        disambiguation: artist.disambiguation,
      }),
      albums,
    };
  }

  /**
   * Get albums by artist MBID.
   * Serves the ContentProvider contract.
   */
  async getArtistAlbums(artistExternalId, limit = 10) {
    const rgData = await adapter.getArtistReleaseGroups(artistExternalId);
    const groups = sortByDateAsc((rgData?.['release-groups'] || []).filter(isMainAlbum)).slice(0, limit);

    const artist = { id: artistExternalId, name: '' };
    const albums = groups
      .map(rg => normalizeAlbum(rg, artist, null, null))
      .filter(Boolean);

    return { albums };
  }

  /**
   * Get a single album (release group) by MBID.
   */
  async getAlbum(externalId) {
    // Need release group data; fetch via the first release's release-group relation
    const releaseData = await adapter.getFirstReleaseForGroup(externalId);
    const releaseMbid = releaseData?.releases?.[0]?.id;
    if (!releaseMbid) {
      throw new AppError('Album not found', 404, 'NOT_FOUND');
    }

    const trackData = await adapter.getReleaseTracklist(releaseMbid);
    const firstRg = trackData?.['release-group'];
    if (!firstRg) {
      throw new AppError('Album metadata not found', 404, 'NOT_FOUND');
    }

    const caaData = await adapter.getCoverArtForReleaseGroup(externalId);
    return normalizeAlbum(firstRg, null, caaData, { releases: [trackData] });
  }

  /**
   * Get tracks for an album (release group) by MBID.
   */
  async getAlbumTracks(externalId) {
    const releaseData = await adapter.getFirstReleaseForGroup(externalId);
    const releaseMbid = releaseData?.releases?.[0]?.id;
    if (!releaseMbid) {
      throw new AppError('Album not found', 404, 'NOT_FOUND');
    }

    const trackData = await adapter.getReleaseTracklist(releaseMbid);
    const firstRg = trackData?.['release-group'];
    const caaData = await adapter.getCoverArtForReleaseGroup(externalId);
    const album = normalizeAlbum(firstRg, null, caaData, { releases: [trackData] });
    const ac = firstRg?.['artist-credit']?.[0] || trackData?.['artist-credit']?.[0];
    const artist = ac
      ? {
          name: ac.artist?.name || ac.name,
          id: ac.artist?.id || null,
        }
      : null;
    const mbTracks = normalizeTracks(trackData, album, artist);
    const tracks = await resolveTracksToYouTube(mbTracks);

    return { tracks, album };
  }

  // Unused ContentProvider methods
  async searchTracks() { return { tracks: [] }; }
  async searchArtists() { return { artists: [] }; }
  async getTrack() { throw new AppError('MusicBrainz does not provide playback streams', 501, 'NOT_IMPLEMENTED'); }
  async getArtistTracks() { return { tracks: [] }; }
  async getRecommended() { return { tracks: [] }; }
  async getTracksByGenre() { return { tracks: [] }; }
}
