import { getContentById, getPosterUrl } from '../services/tmdb.js';
import { upsertMovie, getMovieIdByTmdbId } from '../models/movies.js';
import {
  addToWatchlist,
  getWatchlistByUser,
  updateWatchStatus,
  removeFromWatchlist,
  getWatchlistEntryById,
} from '../models/watchlist.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors/http.js';

export async function ensureMovieId(tmdbId) {
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

export async function getWatchlistHandler(req, res) {
  const { userId } = req.validated.params;
  const targetId = Number(userId);
  if (req.user.role !== 'admin' && req.user.sub !== targetId) {
    throw new ForbiddenError();
  }
  const watchlist = await getWatchlistByUser(targetId);
  res.json(watchlist);
}

export async function addToWatchlistHandler(req, res) {
  const { tmdbId, userId, status } = req.validated.body;
  if (req.user.role !== 'admin' && Number(userId) !== req.user.sub) {
    throw new ForbiddenError();
  }
  const movieId = await ensureMovieId(tmdbId);
  const entry = await addToWatchlist({
    userId,
    movieId,
    status,
  });
  res.status(201).json(entry);
}

export async function updateWatchlistHandler(req, res) {
  const { id } = req.validated.params;
  const { status } = req.body || {};
  if (!status || !['planned', 'watching', 'completed'].includes(status)) {
    throw new BadRequestError('status must be planned, watching, or completed');
  }
  const entry = await getWatchlistEntryById(Number(id));
  if (!entry) {
    throw new NotFoundError('Watchlist entry not found');
  }
  if (req.user?.role !== 'admin' && entry.user_id !== req.user?.sub) {
    throw new ForbiddenError();
  }
  const updated = await updateWatchStatus(Number(id), status);
  if (!updated) {
    throw new NotFoundError('Watchlist entry not found');
  }
  res.json(updated);
}

export async function deleteWatchlistHandler(req, res) {
  const { id } = req.validated.params;
  const entry = await getWatchlistEntryById(Number(id));
  if (!entry) {
    throw new NotFoundError('Watchlist entry not found');
  }
  if (req.user?.role !== 'admin' && entry.user_id !== req.user?.sub) {
    throw new ForbiddenError();
  }
  const deleted = await removeFromWatchlist(Number(id));
  if (!deleted) {
    throw new NotFoundError('Watchlist entry not found');
  }
  res.status(204).send();
}
