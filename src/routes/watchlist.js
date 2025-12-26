import express from 'express';
import { z } from 'zod';
import { getContentById, getPosterUrl } from '../services/tmdb.js';
import { upsertMovie, getMovieIdByTmdbId } from '../db/movies.js';
import {
  addToWatchlist,
  getWatchlistByUser,
  updateWatchStatus,
  removeFromWatchlist,
  getWatchlistEntryById,
} from '../db/watchlist.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

// eslint-disable-next-line new-cap
const router = express.Router();
const allowedStatuses = ['planned', 'watching', 'completed'];

const watchlistCreateSchema = z.object({
  body: z.object({
    tmdbId: z.number().int(),
    userId: z.number().int(),
    status: z.enum(['planned', 'watching', 'completed']).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const watchlistIdSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/, 'id must be a number') }),
  body: z.object({}).passthrough().optional(),
  query: z.object({}).optional(),
});

const watchlistGetSchema = z.object({
  params: z.object({ userId: z.string().regex(/^\d+$/, 'userId must be a number') }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

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

router.get('/:userId', requireAuth, validate(watchlistGetSchema), async (req, res, next) => {
  try {
    const { userId } = req.validated.params;
    const numericUserId = Number(userId);
    if (req.user?.role !== 'admin' && req.user?.sub !== numericUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const items = await getWatchlistByUser(numericUserId);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, validate(watchlistCreateSchema), async (req, res, next) => {
  try {
    const { tmdbId, userId, status = 'planned' } = req.validated.body;
    if (req.user?.role !== 'admin' && req.user?.sub !== Number(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'status must be planned, watching, or completed' });
    }
    const movieId = await ensureMovieId(tmdbId);
    const watch = await addToWatchlist({ userId, movieId, status });
    res.status(201).json(watch);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, validate(watchlistIdSchema), async (req, res, next) => {
  try {
    const { id } = req.validated.params;
    const { status } = req.body || {};
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'status must be planned, watching, or completed' });
    }
    const entry = await getWatchlistEntryById(Number(id));
    if (!entry) {
      return res.status(404).json({ error: 'Watchlist entry not found' });
    }
    if (req.user?.role !== 'admin' && entry.user_id !== req.user?.sub) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const updated = await updateWatchStatus(Number(id), status);
    if (!updated) {
      return res.status(404).json({ error: 'Watchlist entry not found' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, validate(watchlistIdSchema), async (req, res, next) => {
  try {
    const { id } = req.validated.params;
    const entry = await getWatchlistEntryById(Number(id));
    if (!entry) {
      return res.status(404).json({ error: 'Watchlist entry not found' });
    }
    if (req.user?.role !== 'admin' && entry.user_id !== req.user?.sub) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const deleted = await removeFromWatchlist(Number(id));
    if (!deleted) {
      return res.status(404).json({ error: 'Watchlist entry not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
