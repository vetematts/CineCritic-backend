import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
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

router.get('/:userId', requireAuth, validate(watchlistGetSchema), getWatchlistHandler);
router.post('/', requireAuth, validate(watchlistCreateSchema), addToWatchlistHandler);
router.put('/:id', requireAuth, validate(watchlistIdSchema), updateWatchlistHandler);
router.delete('/:id', requireAuth, validate(watchlistIdSchema), deleteWatchlistHandler);

export default router;
