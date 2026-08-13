import { getAllGenres, getGenreDefinition } from './genres.js';
import * as contentService from '../services/contentService.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';

function getBaseUrl(req) {
  return `http://${req.headers.host || 'localhost'}`;
}

function parseLimit(url) {
  const raw = url.searchParams.get('limit');
  const value = raw ? parseInt(raw, 10) : 10;
  return Number.isNaN(value) ? 10 : Math.min(Math.max(value, 1), 25);
}

/**
 * GET /api/genres - List all available genres
 */
export async function listGenres(req, res) {
  const genres = getAllGenres();
  sendSuccess(res, 200, { genres });
}

/**
 * GET /api/genres/:id/tracks - Get tracks for a genre
 */
export async function getGenreTracks(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const parts = url.pathname.split('/').filter(Boolean);
  const genreId = parts[2];
  const limit = parseLimit(url);

  if (!genreId) {
    throw new AppError('Genre ID is required', 400, 'VALIDATION_ERROR');
  }

  const genre = getGenreDefinition(genreId);
  if (!genre) {
    throw new AppError('Genre not found', 404, 'NOT_FOUND');
  }

  const { tracks } = await contentService.getTracksByGenre(genre.queries[0], limit);
  sendSuccess(res, 200, { genre: { id: genre.id, name: genre.name }, tracks });
}
