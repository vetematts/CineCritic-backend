import express from 'express';
import { z } from 'zod';
import { BadRequestError } from '../errors/http.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import {
  getTrendingHandler,
  getUserTrendingHandler,
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

/**
 * @swagger
 * /api/movies/trending:
 *   get:
 *     summary: Get trending movies
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: List of trending items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TmdbPagedMovies'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/trending', asyncHandler(getTrendingHandler));

/**
 * @swagger
 * /api/movies/trending-users:
 *   get:
 *     summary: Get user trending movies from recent likes
 *     description: Uses likes as engagement signals. Likes are separate from review ratings.
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         description: Ranking window in days (default 30)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum results (default 20)
 *     responses:
 *       200:
 *         description: List of user-trending movies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   tmdb_id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   release_year:
 *                     type: integer
 *                   poster_url:
 *                     type: string
 *                     nullable: true
 *                   content_type:
 *                     type: string
 *                     enum: [movie, tv]
 *                   likes_last_window:
 *                     type: integer
 *                   latest_like_at:
 *                     type: string
 *                     format: date-time
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/trending-users', asyncHandler(getUserTrendingHandler));

/**
 * @swagger
 * /api/movies/top-rated:
 *   get:
 *     summary: Get top rated movies
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: List of top rated items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TmdbPagedMovies'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/top-rated', asyncHandler(getTopRatedHandler));

/**
 * @swagger
 * /api/movies/genres:
 *   get:
 *     summary: Get genres
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: List of genres
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TmdbGenresResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/genres', asyncHandler(getGenresHandler));

/**
 * @swagger
 * /api/movies/year/{year}:
 *   get:
 *     summary: Get movies by release year
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort option
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit results
 *     responses:
 *       200:
 *         description: Results for the year
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TmdbPagedMovies'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/year/:year', asyncHandler(getByYearHandler));

/**
 * @swagger
 * /api/movies/genre/{id}:
 *   get:
 *     summary: Get movies by genre
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Results for the genre
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TmdbPagedMovies'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/genre/:id', asyncHandler(getByGenreHandler));

/**
 * @swagger
 * /api/movies/search:
 *   get:
 *     summary: Search movies
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TmdbPagedMovies'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/search', asyncHandler(searchHandler));

/**
 * @swagger
 * /api/movies/advanced:
 *   get:
 *     summary: Advanced movie search (title/year/genres/crew/rating)
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Title keyword
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *         description: Release year (YYYY)
 *       - in: query
 *         name: genres
 *         schema:
 *           type: string
 *         description: Comma-separated TMDB genre ids
 *       - in: query
 *         name: crew
 *         schema:
 *           type: string
 *         description: Crew name (uses TMDB person search)
 *       - in: query
 *         name: ratingMin
 *         schema:
 *           type: string
 *         description: Minimum vote_average
 *       - in: query
 *         name: ratingMax
 *         schema:
 *           type: string
 *         description: Maximum vote_average
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: Matching movies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TmdbPagedMovies'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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

/**
 * @swagger
 * /api/movies/{id}:
 *   get:
 *     summary: Get movie by TMDB id
 *     description: Fetches TMDB details and caches the movie/genres in Postgres.
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Movie details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MovieDetail'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', asyncHandler(getByIdHandler));

export default router;
