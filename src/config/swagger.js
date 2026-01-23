/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID
 *         username:
 *           type: string
 *           description: Username
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User role
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         favourite_movie_id:
 *           type: integer
 *           nullable: true
 *           description: TMDB ID of user's favourite movie
 *
 *     Error:
 *       type: object
 *       required: [success, status, error, code, timestamp]
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         status:
 *           type: integer
 *           example: 401
 *         error:
 *           type: string
 *           example: 'Unauthorized'
 *         code:
 *           type: string
 *           example: 'unauthorised'
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: '2024-01-15T10:30:00.000Z'
 *
 *     MovieSummary:
 *       type: object
 *       required: [id, title]
 *       properties:
 *         id:
 *           type: integer
 *           description: TMDB movie ID
 *           example: 129
 *         title:
 *           type: string
 *           description: Movie title
 *           example: 'Spirited Away'
 *         poster_path:
 *           type: string
 *           nullable: true
 *           description: Poster image path
 *           example: '/poster.jpg'
 *         release_date:
 *           type: string
 *           nullable: true
 *           description: Release date (YYYY-MM-DD)
 *           example: '2001-07-20'
 *         vote_average:
 *           type: number
 *           description: Average rating
 *           example: 8.5
 *       additionalProperties: true
 *
 *     MovieDetail:
 *       allOf:
 *         - $ref: '#/components/schemas/MovieSummary'
 *         - type: object
 *           properties:
 *             overview:
 *               type: string
 *               example: 'A young girl enters the world of spirits...'
 *             genres:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Genre'
 *           additionalProperties: true
 *
 *     Genre:
 *       type: object
 *       required: [id, name]
 *       properties:
 *         id:
 *           type: integer
 *           description: TMDB genre ID
 *           example: 16
 *         name:
 *           type: string
 *           description: Genre name
 *           example: 'Animation'
 *
 *     TmdbPagedMovies:
 *       type: object
 *       required: [page, results]
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         results:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MovieSummary'
 *         total_pages:
 *           type: integer
 *           example: 10
 *         total_results:
 *           type: integer
 *           example: 200
 *       additionalProperties: true
 *
 *     TmdbGenresResponse:
 *       type: object
 *       required: [genres]
 *       properties:
 *         genres:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Genre'
 *
 *     Review:
 *       type: object
 *       required: [id, tmdbId, userId, rating]
 *       properties:
 *         id:
 *           type: integer
 *           description: Review ID
 *           example: 1
 *         tmdbId:
 *           type: integer
 *           description: TMDB movie ID
 *           example: 129
 *         userId:
 *           type: integer
 *           description: User ID who wrote the review
 *           example: 5
 *         rating:
 *           type: number
 *           format: float
 *           description: Rating between 0.5 and 5.0
 *           example: 4.5
 *         body:
 *           type: string
 *           nullable: true
 *           description: Review text content
 *           example: 'Loved the visuals and story.'
 *         status:
 *           type: string
 *           enum: [draft, published, flagged]
 *           description: Review status
 *           example: published
 *         created_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Review creation timestamp
 *           example: '2026-01-11T07:15:00Z'
 *       additionalProperties: true
 *
 *     WatchlistEntry:
 *       type: object
 *       required: [id, tmdbId, userId, status]
 *       properties:
 *         id:
 *           type: integer
 *           description: Watchlist entry ID
 *           example: 10
 *         tmdbId:
 *           type: integer
 *           description: TMDB movie ID
 *           example: 129
 *         userId:
 *           type: integer
 *           description: User ID
 *           example: 5
 *         status:
 *           type: string
 *           enum: [planned, watching, completed]
 *           description: Watchlist status
 *           example: planned
 *         created_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Entry creation timestamp
 *           example: '2026-01-11T07:15:00Z'
 *       additionalProperties: true
 *
 *     FavouriteEntry:
 *       type: object
 *       required: [id, tmdbId, userId]
 *       properties:
 *         id:
 *           type: integer
 *           description: Favourite entry ID
 *           example: 22
 *         tmdbId:
 *           type: integer
 *           description: TMDB movie ID
 *           example: 129
 *         userId:
 *           type: integer
 *           description: User ID
 *           example: 5
 *         title:
 *           type: string
 *           nullable: true
 *           description: Movie title (cached)
 *           example: 'Spirited Away'
 *       additionalProperties: true
 *
 *   responses:
 *     BadRequestError:
 *       description: Bad request
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error: 'Invalid parameters'
 *             code: 'REQ_400'
 *
 *     UnauthorizedError:
 *       description: Unauthorized
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error: 'Missing or invalid token'
 *             code: 'AUTH_401'
 *
 *     ForbiddenError:
 *       description: Forbidden
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error: 'Forbidden'
 *             code: 'AUTH_403'
 *
 *     NotFoundError:
 *       description: Not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error: 'Not found'
 *             code: 'GEN_404'
 *
 *     ServerError:
 *       description: Server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             error: 'Server error'
 *             code: 'SRV_500'
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'CineCritic API',
      version: '0.1.0',
      description: 'API for fetching movie data via TMDB proxy and CineCritic resources.',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Local development',
      },
      {
        url: 'https://cinecritic.onrender.com',
        description: 'Production (Render)',
      },
    ],
    tags: [
      {
        name: 'Movies',
        description: 'Movie discovery and search endpoints',
      },
      {
        name: 'Users',
        description: 'User authentication and management',
      },
      {
        name: 'Reviews',
        description: 'Movie reviews and ratings',
      },
      {
        name: 'Favourites',
        description: 'User favourite movies',
      },
      {
        name: 'Watchlist',
        description: 'User watchlist management',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../index.js'),
    path.join(__dirname, 'swagger.js'),
  ],
};
