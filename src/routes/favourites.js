import express from 'express';
import { z } from 'zod';

import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

import {
  addToFavouritesHandler,
  deleteFavouritesHandler,
  getFavouritesHandler,
} from '../controllers/favouritesController.js';

// eslint-disable-next-line new-cap
const router = express.Router();

const favouritesCreateSchema = z.object({
  body: z.object({
    userId: z.number().int(),
    tmdbId: z.number().int(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const favouritesKeySchema = z.object({
  params: z.object({
    userId: z.string().regex(/^\d+$/, 'userId must be a number'),
    tmdbId: z.string().regex(/^\d+$/, 'tmdbId must be a number'),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

const favouritesGetSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^\d+$/, 'userId must be a number'),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

/**
 * @swagger
 * /api/favourites:
 *   post:
 *     summary: Add a movie to favourites
 *     tags: [Favourites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tmdbId, userId]
 *             properties:
 *               tmdbId:
 *                 type: integer
 *               userId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Favourite created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavouriteEntry'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/',
  requireAuth,
  validate(favouritesCreateSchema),
  asyncHandler(addToFavouritesHandler)
);

/**
 * @swagger
 * /api/favourites/{userId}:
 *   get:
 *     summary: Get a user's favourite movies
 *     tags: [Favourites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Favourite movies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FavouriteEntry'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/:userId',
  requireAuth,
  validate(favouritesGetSchema),
  asyncHandler(getFavouritesHandler)
);

/**
 * @swagger
 * /api/favourites/{userId}/{tmdbId}:
 *   delete:
 *     summary: Remove a movie from favourites
 *     tags: [Favourites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: tmdbId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete(
  '/:userId/:tmdbId',
  requireAuth,
  validate(favouritesKeySchema),
  asyncHandler(deleteFavouritesHandler)
);

export default router;
