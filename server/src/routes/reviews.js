import { Router } from 'express';
import { getContentById, getPosterUrl } from '../tmdb.js';
import { upsertMovie, getMovieIdByTmdbId } from '../db/movies.js';
import { createReview, getReviewsByMovie, updateReview, deleteReview } from '../db/reviews.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

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

router.get('/:tmdbId', async (req, res, next) => {
  try {
    const { tmdbId } = req.params;
    const movieId = await ensureMovieId(tmdbId);
    const reviews = await getReviewsByMovie(movieId);
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { tmdbId, userId, rating, body, status = 'published' } = req.body || {};
    if (!tmdbId || !userId || rating === undefined) {
      return res.status(400).json({ error: 'tmdbId, userId, and rating are required' });
    }
    const numericRating = Number(rating);
    const validRatings = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    if (!validRatings.includes(numericRating)) {
      return res.status(400).json({ error: 'rating must be between 0.5 and 5 in 0.5 steps' });
    }

    const movieId = await ensureMovieId(tmdbId);
    const review = await createReview({
      userId,
      movieId,
      rating: numericRating,
      body,
      status,
    });
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await updateReview(Number(id), req.body || {});
    if (!review) {
      return res.status(404).json({ error: 'Review not found or no fields to update' });
    }
    res.json(review);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await deleteReview(Number(id));
    if (!deleted) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
