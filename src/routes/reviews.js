import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import {
  getReviewsByTmdbId,
  getReviewByIdHandler,
  createReviewHandler,
  updateReviewHandler,
  deleteReviewHandler,
  getReviewsByUserHandler,
} from '../controllers/reviewsController.js';

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

/**
 * @swagger
 * /api/reviews/{tmdbId}:
 *   get:
 *     summary: Get reviews for a movie by TMDB id
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: tmdbId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reviews for the movie
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/user/:userId', requireAuth, asyncHandler(getReviewsByUserHandler));
router.get('/:tmdbId', asyncHandler(getReviewsByTmdbId));

/**
 * @swagger
 * /api/reviews/id/{id}:
 *   get:
 *     summary: Get a review by id
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/id/:id', validate(idParamSchema), asyncHandler(getReviewByIdHandler));

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review for a movie
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tmdbId, userId, rating]
 *             properties:
 *               tmdbId:
 *                 type: integer
 *               userId:
 *                 type: integer
 *               rating:
 *                 type: number
 *                 format: float
 *                 description: Rating between 0.5 and 5 in 0.5 steps
 *               body:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, flagged]
 *                 default: published
 *     responses:
 *       201:
 *         description: Review created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', requireAuth, validate(createReviewSchema), asyncHandler(createReviewHandler));

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
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
 *             properties:
 *               rating:
 *                 type: number
 *                 format: float
 *               body:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, flagged]
 *     responses:
 *       200:
 *         description: Review updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
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
 *         description: Review deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id', requireAuth, validate(idParamSchema), asyncHandler(updateReviewHandler));
router.delete('/:id', requireAuth, validate(idParamSchema), asyncHandler(deleteReviewHandler));

export default router;
