import { Router } from 'express';
import { getContentById, getPosterUrl } from '../tmdb.js';
import { upsertMovie, getMovieIdByTmdbId } from '../db/movies.js';
import {
  addToWatchlist,
  getWatchlistByUser,
  updateWatchStatus,
  removeFromWatchlist,
  getWatchlistEntryById,
} from '../db/watchlist.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();
const allowedStatuses = ['planned', 'watching', 'completed'];

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

router.get('/:userId', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (req.user?.role !== 'admin' && req.user?.sub !== Number(userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const items = await getWatchlistByUser(Number(userId));
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { tmdbId, userId, status = 'planned' } = req.body || {};
    if (!tmdbId || !userId) {
      return res.status(400).json({ error: 'tmdbId and userId are required' });
    }
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

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
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

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
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
