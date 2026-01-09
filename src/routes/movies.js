import express from 'express';
import { BadRequestError } from '../errors/http.js';
import {
  getTrending,
  getTopRated,
  getContentByYear,
  getContentByGenre,
  getContentById,
  getCachedGenres,
  searchContent,
  getPosterUrl,
  discoverMovies,
} from '../services/tmdb.js';
import { upsertMovie } from '../db/movies.js';
import { z } from 'zod';

// eslint-disable-next-line new-cap
const router = express.Router();

const advancedSearchSchema = z.object({
  query: z.string().optional(),
  year: z
    .string()
    .regex(/^\d{4}$/, 'year must be YYYY')
    .transform((val) => Number(val))
    .optional(),
  page: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => Number(val))
    .default('1'),
  ratingMin: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .transform((val) => Number(val))
    .optional(),
  ratingMax: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .transform((val) => Number(val))
    .optional(),
  crew: z.string().optional(),
  genres: z
    .string()
    .regex(/^\d+(,\d+)*$/)
    .transform((val) => val.split(',').map((g) => Number(g)))
    .optional(),
});

router.get('/trending', async (req, res, next) => {
  try {
    const results = await getTrending('movie');
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/top-rated', async (req, res, next) => {
  try {
    const results = await getTopRated('movie');
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/genres', async (req, res, next) => {
  try {
    const genres = await getCachedGenres('movie');
    res.json(genres);
  } catch (err) {
    next(err);
  }
});

router.get('/year/:year', async (req, res, next) => {
  try {
    const { year } = req.params;
    const { sortBy = 'popularity.desc', limit = 20 } = req.query;
    const results = await getContentByYear(Number(year), 'movie', sortBy, Number(limit));
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/genre/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sortBy = 'popularity.desc', page = 1 } = req.query;
    const results = await getContentByGenre(Number(id), 'movie', sortBy, Number(page));
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const { q = '', page = 1 } = req.query;
    if (!q) {
      throw new BadRequestError('Query parameter q is required');
    }
    const results = await searchContent(q, 'movie', Number(page));
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/advanced', async (req, res, next) => {
  try {
    const parsed = advancedSearchSchema.parse(req.query);
    const results = await discoverMovies({
      query: parsed.query,
      year: parsed.year,
      genres: parsed.genres,
      ratingMin: parsed.ratingMin,
      ratingMax: parsed.ratingMax,
      crewName: parsed.crew,
      page: parsed.page,
    });
    res.json(results);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new BadRequestError(err.errors.map((e) => e.message).join('; ')));
    }
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getContentById(Number(id), 'movie');

    // Cache minimal movie fields for FK references (reviews/watchlist).
    const releaseYear = result.release_date ? new Date(result.release_date).getFullYear() : null;
    await upsertMovie({
      tmdbId: result.id,
      title: result.title,
      releaseYear,
      posterUrl: getPosterUrl(result.poster_path),
      contentType: 'movie',
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
