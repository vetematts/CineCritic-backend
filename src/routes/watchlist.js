import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import {
  getWatchlistHandler,
  addToWatchlistHandler,
  updateWatchlistHandler,
  deleteWatchlistHandler,
} from '../controllers/watchlistController.js';

// eslint-disable-next-line new-cap
const router = express.Router();

const watchlistCreateSchema = z.object({
  body: z.object({
    tmdbId: z.number().int(),
    userId: z.number().int(),
    status: z.enum(['planned', 'watching', 'completed']).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const watchlistIdSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/, 'id must be a number') }),
  body: z.object({}).passthrough().optional(),
  query: z.object({}).optional(),
});

const watchlistGetSchema = z.object({
  params: z.object({ userId: z.string().regex(/^\d+$/, 'userId must be a number') }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

/**
 * @swagger
 * /api/watchlist/{userId}:
 *   get:
 *     summary: Get a user watchlist
 *     tags: [Watchlist]
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
 *         description: Watchlist items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WatchlistEntry'
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
  validate(watchlistGetSchema),
  asyncHandler(getWatchlistHandler)
);

/**
 * @swagger
 * /api/watchlist:
 *   post:
 *     summary: Add/update watchlist entry
 *     tags: [Watchlist]
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
 *               status:
 *                 type: string
 *                 enum: [planned, watching, completed]
 *                 default: planned
 *     responses:
 *       201:
 *         description: Watchlist entry created/updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WatchlistEntry'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', requireAuth, validate(watchlistCreateSchema), asyncHandler(addToWatchlistHandler));

/**
 * @swagger
 * /api/watchlist/{id}:
 *   put:
 *     summary: Update watchlist status
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [planned, watching, completed]
 *     responses:
 *       200:
 *         description: Updated entry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WatchlistEntry'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   delete:
 *     summary: Remove watchlist entry
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
router.put('/:id', requireAuth, validate(watchlistIdSchema), asyncHandler(updateWatchlistHandler));
router.delete(
  '/:id',
  requireAuth,
  validate(watchlistIdSchema),
  asyncHandler(deleteWatchlistHandler)
);

export default router;
