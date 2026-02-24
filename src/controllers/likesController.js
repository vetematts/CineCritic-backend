import { ConflictError, NotFoundError } from '../errors/http.js';
import { getContentById, getPosterUrl } from '../services/tmdb.js';
import { getMovieIdByTmdbId, upsertMovie } from '../models/movies.js';
import { addMovieLike, removeMovieLike } from '../models/likes.js';

/**
 * Ensure a local movie row exists for a TMDB movie id and return its local id.
 * @param {number} tmdbId TMDB movie id
 * @returns {Promise<number>} Local movie id
 */
async function ensureMovieId(tmdbId) {
  const existingId = await getMovieIdByTmdbId(Number(tmdbId));
  if (existingId) return existingId;

  const movie = await getContentById(Number(tmdbId), 'movie');
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const saved = await upsertMovie({
    tmdbId: movie.id,
    title: movie.title,
    releaseYear,
    posterUrl: getPosterUrl(movie.poster_path),
    contentType: 'movie',
  });
  return saved.id;
}

/**
 * Add a user movie like used for trending calculations.
 * @param {import('express').Request} req Express request
 * @param {import('express').Response} res Express response
 * @returns {Promise<void>}
 */
export async function addMovieLikeHandler(req, res) {
  const { tmdbId } = req.validated.body;
  const userId = req.user.sub;
  const movieId = await ensureMovieId(tmdbId);

  try {
    const like = await addMovieLike({ userId, movieId });
    res.status(201).json(like);
  } catch (err) {
    if (err?.code === '23505') {
      throw new ConflictError('You have already liked this movie');
    }
    throw err;
  }
}

/**
 * Remove a user movie like for a TMDB movie.
 * @param {import('express').Request} req Express request
 * @param {import('express').Response} res Express response
 * @returns {Promise<void>}
 */
export async function removeMovieLikeHandler(req, res) {
  const { tmdbId } = req.validated.params;
  const userId = req.user.sub;
  const movieId = await getMovieIdByTmdbId(Number(tmdbId));
  if (!movieId) {
    throw new NotFoundError('Movie not found');
  }

  const deleted = await removeMovieLike({ userId, movieId });
  if (!deleted) {
    throw new NotFoundError('Like not found');
  }
  res.status(204).send();
}
