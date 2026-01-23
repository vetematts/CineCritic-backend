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

router.post(
  '/',
  requireAuth,
  validate(favouritesCreateSchema),
  asyncHandler(addToFavouritesHandler)
);

router.get(
  '/:userId',
  requireAuth,
  validate(favouritesGetSchema),
  asyncHandler(getFavouritesHandler)
);

router.delete(
  '/:userId/:tmdbId',
  requireAuth,
  validate(favouritesKeySchema),
  asyncHandler(deleteFavouritesHandler)
);

export default router;
