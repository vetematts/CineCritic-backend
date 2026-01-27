import express from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import {
  getFavouritesPublicHandler,
} from '../controllers/favouritesController.js';
import { getWatchlistPublicHandler } from '../controllers/watchlistController.js';
import { getReviewsByUserPublicHandler } from '../controllers/reviewsController.js';

// eslint-disable-next-line new-cap
const router = express.Router();

const userIdParams = z.object({
  userId: z.string().regex(/^\d+$/, 'userId must be a number'),
});

router.get(
  '/users/:userId/favourites',
  validate({ params: userIdParams }),
  asyncHandler(getFavouritesPublicHandler)
);

router.get(
  '/users/:userId/watchlist',
  validate({ params: userIdParams }),
  asyncHandler(getWatchlistPublicHandler)
);

router.get(
  '/users/:userId/reviews',
  validate({ params: userIdParams }),
  asyncHandler(getReviewsByUserPublicHandler)
);

export default router;
