import { getContentById, getPosterUrl } from '../services/tmdb.js';
import { upsertMovie, getMovieIdByTmdbId } from '../db/movies.js';
import {
  createReview,
  getReviewsByMovie,
  updateReview,
  deleteReview,
  getReviewById,
} from '../db/reviews.js';
import { ForbiddenError, NotFoundError } from '../errors/http.js';

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

export async function getReviewsByTmdbId(req, res, next) {
  try {
    const { tmdbId } = req.params;
    const movieId = await ensureMovieId(tmdbId);
    const reviews = await getReviewsByMovie(movieId);
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

export async function getReviewByIdHandler(req, res, next) {
  try {
    const { id } = req.validated.params;
    const review = await getReviewById(Number(id));
    if (!review) {
      throw new NotFoundError('Review not found');
    }
    res.json(review);
  } catch (err) {
    next(err);
  }
}

export async function createReviewHandler(req, res, next) {
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
}

export async function updateReviewHandler(req, res, next) {
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
}

export async function deleteReviewHandler(req, res, next) {
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
}
