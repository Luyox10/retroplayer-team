import { searchYouTubeVideos } from '../youtube.js';
import { AppError } from '../../utils/errors.js';
import { sendSuccess } from '../../utils/response.js';

function getBaseUrl(req) {
  return `http://${req.headers.host || 'localhost'}`;
}

export async function search(req, res) {
  const url = new URL(req.url, getBaseUrl(req));
  const q = url.searchParams.get('q');
  if (!q || !q.trim()) {
    throw new AppError('Search query is required', 400, 'VALIDATION_ERROR');
  }

  const rawMax = url.searchParams.get('maxResults');
  const parsedMax = rawMax ? parseInt(rawMax, 10) : 10;
  const maxResults = Number.isNaN(parsedMax) ? 10 : Math.min(Math.max(parsedMax, 1), 25);

  const result = await searchYouTubeVideos(q, maxResults);

  sendSuccess(res, 200, {
    tracks: result.results,
    meta: {
      query: q.trim(),
      source: 'youtube',
      totalFetched: result.results.length,
      maxResults,
      nextPageToken: result.nextPageToken,
    },
  });
}
