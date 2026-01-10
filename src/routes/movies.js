import express from 'express';
import { z } from 'zod';
import { BadRequestError } from '../errors/http.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
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

router.get('/trending', asyncHandler(getTrendingHandler));

router.get('/top-rated', asyncHandler(getTopRatedHandler));

router.get('/genres', asyncHandler(getGenresHandler));

router.get('/year/:year', asyncHandler(getByYearHandler));

router.get('/genre/:id', asyncHandler(getByGenreHandler));

router.get('/search', asyncHandler(searchHandler));

router.get('/advanced', async (req, res, next) => {
  try {
    const parsed = advancedSearchSchema.parse(req.query);
    req.parsed = parsed;
    await asyncHandler(advancedSearchHandler)(req, res, next);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new BadRequestError(err.errors.map((e) => e.message).join('; ')));
    }
    next(err);
  }
});

router.get('/:id', asyncHandler(getByIdHandler));

export default router;
