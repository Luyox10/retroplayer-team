import * as contentService from '../services/contentService.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';

function getBaseUrl(req) {
  return `http://${req.headers.host || 'localhost'}`;
}

export async function getAlbum(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const parts = url.pathname.split('/').filter(Boolean);
  // /api/albums/:id
  const albumId = parts[2] ? decodeURIComponent(parts[2]) : undefined;

  if (!albumId) {
    throw new AppError('Album ID is required', 400, 'VALIDATION_ERROR');
  }

  const album = await contentService.getAlbum(albumId);
  sendSuccess(res, 200, { album });
}

export async function getAlbumTracks(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const parts = url.pathname.split('/').filter(Boolean);
  // /api/albums/:id/tracks
  const albumId = parts[2] ? decodeURIComponent(parts[2]) : undefined;

  if (!albumId) {
    throw new AppError('Album ID is required', 400, 'VALIDATION_ERROR');
  }

  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const pageToken = url.searchParams.get('pageToken') || '';

  const [album, tracksData] = await Promise.all([
    contentService.getAlbum(albumId),
    contentService.getAlbumTracks(albumId, { limit, pageToken }),
  ]);

  sendSuccess(res, 200, {
    album,
    tracks: tracksData.tracks,
    nextPageToken: tracksData.nextPageToken || null,
  });
}
