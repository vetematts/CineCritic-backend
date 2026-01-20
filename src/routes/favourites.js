import express from "express";
import {z} from "zod";

// Import Middlewares - Authentication, validation, handling promises
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

// Import the Favourites Table and Controller
import { 
    deleteFavouritesHandler, 
    getFavouritesHandler 
} from "../controllers/favouritesController.js";
import { addToFavourites } from "../models/favourites.js";

// Create an instance of the router
const router = express.Router();

// Set the expectations of what will be passed as a 
// request and response to the favourites routes
const favouritesCreateSchema = z.object({
    // Expect a JSON body with only two arguments, userId and movieId
    body: z.object({
        userId: z.number().int(),   // UserId is an int
        movieId: z.number().int(),  // MovieId is an int
    }),
    // Parameters and queries can send undefined for debugging
    params: z.object({}).optional(),
    query: z.object({}).optional(),
});

// Checks that the request sent to the favourites route are integers only
// Specifically for the delete route
const favouritesKeySchema = z.object({
    // UserId and MovieId must be ints only
    params: z.object({ 
        userId: z.string().regex(/^\d+$/, 'userId must be a number'),
        movieId: z.string().regex(/^\d+$/, 'movieId must be a number'),
    }),
    // Parameters and queries can send undefined for debugging
    body: z.object({}).optional(),
    query: z.object({}).optional(),
});

// Create the rules and validations for getting a user's favourite movies
const favouritesGetSchema = z.object({
    params: z.object({ 
        userId: z.string().regex(/^\d+$/, 'userId must be a number'), 
    }),
    // Parameters and queries can send undefined for debugging
    body: z.object({}).optional(),
    query: z.object({}).optional(),
})

// Create - Add a movie to a user's favourites
router.post(
    '/',
    requireAuth,
    validate(favouritesCreateSchema),
    asyncHandler(addToFavourites)
);

// Read - Get all this user's favourite movies
router.get(
    '/:userId', 
    requireAuth, 
    validate(favouritesGetSchema), 
    asyncHandler(getFavouritesHandler)
);

// Delete - Remove a movie from a user's favourites
router.delete(
    '/:userId/:movieId',
    requireAuth,
    validate(favouritesKeySchema),
    asyncHandler(deleteFavouritesHandler)
);

export default router;