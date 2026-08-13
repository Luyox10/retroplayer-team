/**
 * Genre definitions for RetroPlayer.
 * 
 * Centralized genre registry used by Home, Explore, and recommendations.
 * Each genre has an ID (slug), display name, and YouTube search queries
 * that produce good results for that genre.
 */

import { createGenre } from '../models/contentModels.js';

const GENRE_DEFINITIONS = [
  { id: 'rock', name: 'Rock', queries: ['rock music', 'rock songs'], image: null },
  { id: 'classic-rock', name: 'Rock Clásico', queries: ['classic rock music', 'classic rock greatest hits'], image: null },
  { id: 'alternative-rock', name: 'Rock Alternativo', queries: ['alternative rock music', 'alternative rock songs'], image: null },
  { id: 'hard-rock', name: 'Hard Rock', queries: ['hard rock music', 'hard rock songs'], image: null },
  { id: 'metal', name: 'Metal', queries: ['heavy metal music', 'metal songs'], image: null },
  { id: 'pop', name: 'Pop', queries: ['pop music', 'pop hits'], image: null },
  { id: 'electronic', name: 'Electrónica', queries: ['electronic music', 'electronic dance music'], image: null },
  { id: 'indie', name: 'Indie', queries: ['indie music', 'indie rock'], image: null },
  { id: 'punk', name: 'Punk', queries: ['punk rock music', 'punk songs'], image: null },
  { id: 'blues', name: 'Blues', queries: ['blues music', 'blues guitar'], image: null },
  { id: 'jazz', name: 'Jazz', queries: ['jazz music', 'jazz classics'], image: null },
  { id: 'soul', name: 'Soul', queries: ['soul music', 'soul classics'], image: null },
  { id: 'funk', name: 'Funk', queries: ['funk music', 'funk songs'], image: null },
  { id: 'hip-hop', name: 'Hip Hop', queries: ['hip hop music', 'rap music'], image: null },
  { id: 'reggae', name: 'Reggae', queries: ['reggae music', 'reggae songs'], image: null },
  { id: 'latin', name: 'Latin', queries: ['latin music', 'musica latina'], image: null },
  { id: 'country', name: 'Country', queries: ['country music', 'country songs'], image: null },
  { id: 'retro', name: 'Retro', queries: ['80s music', 'retro music hits'], image: null },
  { id: 'synthwave', name: 'Synthwave', queries: ['synthwave music', 'retrowave'], image: null },
  { id: 'grunge', name: 'Grunge', queries: ['grunge music', 'grunge rock'], image: null },
  { id: 'progressive-rock', name: 'Rock Progresivo', queries: ['progressive rock', 'prog rock'], image: null },
];

const genresMap = new Map(GENRE_DEFINITIONS.map(g => [g.id, g]));

/**
 * Get all available genres as RetroPlayer Genre models
 */
export function getAllGenres() {
  return GENRE_DEFINITIONS.map(g => createGenre(g));
}

/**
 * Get a genre definition by ID (includes search queries)
 */
export function getGenreDefinition(genreId) {
  return genresMap.get(genreId) || null;
}

/**
 * Get the search query for a genre (rotates between queries for variety)
 */
export function getGenreSearchQuery(genreId) {
  const genre = genresMap.get(genreId);
  if (!genre) return genreId;
  // Use a simple rotation based on current hour for variety
  const index = new Date().getHours() % genre.queries.length;
  return genre.queries[index];
}

/**
 * Check if a genre ID exists
 */
export function isValidGenre(genreId) {
  return genresMap.has(genreId);
}
