import express from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { getFavouritesPublicHandler } from '../controllers/favouritesController.js';
import { getWatchlistPublicHandler } from '../controllers/watchlistController.js';
import { getReviewsByUserPublicHandler } from '../controllers/reviewsController.js';

// eslint-disable-next-line new-cap
const router = express.Router();

const userIdParams = z.object({
  userId: z.string().regex(/^\d+$/, 'userId must be a number'),
});

const publicUserSchema = z.object({
  params: userIdParams,
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

router.get(
  '/users/:userId/favourites',
  validate(publicUserSchema),
  asyncHandler(getFavouritesPublicHandler)
);

router.get(
  '/users/:userId/watchlist',
  validate(publicUserSchema),
  asyncHandler(getWatchlistPublicHandler)
);

router.get(
  '/users/:userId/reviews',
  validate(publicUserSchema),
  asyncHandler(getReviewsByUserPublicHandler)
);

export default router;
