import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  getReviewsByTmdbId,
  getReviewByIdHandler,
  createReviewHandler,
  updateReviewHandler,
  deleteReviewHandler,
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

router.get('/:tmdbId', getReviewsByTmdbId);
router.get('/id/:id', validate(idParamSchema), getReviewByIdHandler);
router.post('/', requireAuth, validate(createReviewSchema), createReviewHandler);
router.put('/:id', requireAuth, validate(idParamSchema), updateReviewHandler);
router.delete('/:id', requireAuth, validate(idParamSchema), deleteReviewHandler);

export default router;
