import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { addMovieLikeHandler, removeMovieLikeHandler } from '../controllers/likesController.js';

// eslint-disable-next-line new-cap
const router = express.Router();

const createLikeSchema = z.object({
  body: z.object({
    tmdbId: z.number().int().positive(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const removeLikeSchema = z.object({
  params: z.object({ tmdbId: z.string().regex(/^\d+$/, 'tmdbId must be a number') }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

/**
 * @swagger
 * /api/likes:
 *   post:
 *     summary: Add a movie like
 *     description: Likes are lightweight engagement signals and are distinct from review ratings.
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tmdbId]
 *             properties:
 *               tmdbId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Like created
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', requireAuth, validate(createLikeSchema), asyncHandler(addMovieLikeHandler));

/**
 * @swagger
 * /api/likes/{tmdbId}:
 *   delete:
 *     summary: Remove a movie like
 *     description: Removes a previously added like. This does not affect review ratings.
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tmdbId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Like removed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete(
  '/:tmdbId',
  requireAuth,
  validate(removeLikeSchema),
  asyncHandler(removeMovieLikeHandler)
);

export default router;
