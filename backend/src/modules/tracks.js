import * as contentService from '../services/contentService.js';
import { AppError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';

function getBaseUrl(req) {
  return `http://${req.headers.host || 'localhost'}`;
}

export async function getTrackById(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const parts = url.pathname.split('/').filter(Boolean);
  // /api/tracks/:id  -> parts = ['api', 'tracks', ':id']
  const trackId = parts[2];

  if (!trackId) {
    throw new AppError('Track ID is required', 400, 'VALIDATION_ERROR');
  }

  const track = await contentService.getTrack(trackId);
  sendSuccess(res, 200, { track });
}
