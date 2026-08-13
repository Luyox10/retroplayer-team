/**
 * Preferences API Module
 * 
 * Endpoints for managing user preferences and viewing preference data.
 */

import { requireAuth } from '../middleware/authenticate.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../utils/errors.js';
import {
  getAllPreferences,
  getUserGenreWeights,
  updateGenrePreference,
} from '../services/preferencesService.js';

/**
 * GET /api/preferences
 * Returns user's music preferences.
 * Requires authentication.
 */
export async function getPreferences(req, res) {
  const user = await requireAuth(req);

  const preferences = await getAllPreferences(user.id);
  sendSuccess(res, 200, { preferences });
}

/**
 * GET /api/preferences/genres
 * Returns user's genre weights.
 * Requires authentication.
 */
export async function getGenrePreferences(req, res) {
  const user = await requireAuth(req);

  const weights = await getUserGenreWeights(user.id);
  sendSuccess(res, 200, { genres: weights });
}

/**
 * PUT /api/preferences/genres
 * Update genre preferences.
 * Body: { genres: { "rock": 1.0, "pop": 0.5, ... } }
 * Requires authentication.
 */
export async function updateGenrePreferences(req, res) {
  const user = await requireAuth(req);

  const { genres } = req.body || {};
  if (!genres || typeof genres !== 'object') {
    throw new AppError('genres object is required', 400, 'VALIDATION_ERROR');
  }

  const updates = [];
  for (const [genreId, weight] of Object.entries(genres)) {
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight) || numWeight < 0 || numWeight > 10) continue;
    updates.push(updateGenrePreference(user.id, genreId, numWeight));
  }

  await Promise.all(updates);

  const updatedWeights = await getUserGenreWeights(user.id);
  sendSuccess(res, 200, { genres: updatedWeights });
}
