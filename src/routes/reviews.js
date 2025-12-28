import express from 'express';
import { z } from 'zod';
import { getContentById, getPosterUrl } from '../services/tmdb.js';
import { upsertMovie, getMovieIdByTmdbId } from '../db/movies.js';
import {
  createReview,
  getReviewsByMovie,
  updateReview,
  deleteReview,
  getReviewById,
} from '../db/reviews.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { ForbiddenError, NotFoundError } from '../errors/http.js';

// eslint-disable-next-line new-cap
const router = express.Router();

const ratingEnum = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
const createReviewSchema = z.object({
  body: z.object({
    tmdbId: z.number().int(),
    userId: z.number().int(),
    rating: z.number().refine((val) => ratingEnum.includes(val), {
      message: 'rating must be between 0.5 and 5 in 0.5 steps',
    }),
    body: z.string().optional(),
    status: z.enum(['draft', 'published', 'flagged']).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const idParamSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/, 'id must be a number') }),
  body: z.object({}).passthrough().optional(),
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

router.post('/', requireAuth, validate(createReviewSchema), async (req, res, next) => {
  try {
    const { tmdbId, userId, rating, body, status = 'published' } = req.validated.body;
    if (req.user?.role !== 'admin' && Number(userId) !== req.user?.sub) {
      throw new ForbiddenError();
    }

    const movieId = await ensureMovieId(tmdbId);
    const review = await createReview({
      userId,
      movieId,
      rating,
      body,
      status,
    });
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, validate(idParamSchema), async (req, res, next) => {
  try {
    const { id } = req.validated.params;
    const existing = await getReviewById(Number(id));
    if (!existing) {
      throw new NotFoundError('Review not found or no fields to update');
    }
    if (req.user?.role !== 'admin' && existing.user_id !== req.user?.sub) {
      throw new ForbiddenError();
    }
    const review = await updateReview(Number(id), req.body || {});
    res.json(review);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, validate(idParamSchema), async (req, res, next) => {
  try {
    const { id } = req.validated.params;
    const existing = await getReviewById(Number(id));
    if (!existing) {
      throw new NotFoundError('Review not found');
    }
    if (req.user?.role !== 'admin' && existing.user_id !== req.user?.sub) {
      throw new ForbiddenError();
    }
    const deleted = await deleteReview(Number(id));
    if (!deleted) {
      throw new NotFoundError('Review not found');
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
