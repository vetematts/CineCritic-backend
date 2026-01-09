import express from 'express';
import { z } from 'zod';
import { BadRequestError } from '../errors/http.js';
import {
  getTrendingHandler,
  getTopRatedHandler,
  getGenresHandler,
  getByYearHandler,
  getByGenreHandler,
  searchHandler,
  advancedSearchHandler,
  getByIdHandler,
} from '../controllers/moviesController.js';

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
  await getTrendingHandler(req, res, next);
});

router.get('/top-rated', async (req, res, next) => {
  await getTopRatedHandler(req, res, next);
});

router.get('/genres', async (req, res, next) => {
  await getGenresHandler(req, res, next);
});

router.get('/year/:year', async (req, res, next) => {
  await getByYearHandler(req, res, next);
});

router.get('/genre/:id', async (req, res, next) => {
  await getByGenreHandler(req, res, next);
});

router.get('/search', async (req, res, next) => {
  await searchHandler(req, res, next);
});

router.get('/advanced', async (req, res, next) => {
  try {
    const parsed = advancedSearchSchema.parse(req.query);
    req.parsed = parsed;
    await advancedSearchHandler(req, res, next);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new BadRequestError(err.errors.map((e) => e.message).join('; ')));
    }
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  await getByIdHandler(req, res, next);
});

export default router;
