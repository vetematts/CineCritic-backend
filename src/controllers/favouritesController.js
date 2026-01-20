// Import Middlewares
import { ForbiddenError, NotFoundError } from '../errors/http.js';
import { ensureMovieId } from './watchlistController.js';

// Import Favourites CRUD methods to the PSQL database
import { addToFavourites, getFavourites, removeFromFavourites } from '../models/favourites.js';

// Checks you are the user before adding a movie to your favourites list
export async function addToFavouritesHandler(req, res) {
    const { userId, tmdbId } = req.validated.body;    // Unpackage the userID and tmdbID from the request body
    const targetId = Number(userId);          // Convert the user ID into a number
    if (req.user.role !== 'admin' && req.user.sub !== targetId) {
        // Restrict viewing this unless the one making the request is the user
        // and also an admin
        throw new ForbiddenError();
    }

    const movieId = await ensureMovieId(tmdbId);    // Check this movie exists
    const entry = await addToFavourites({           // Add the movie to this user's favourites
        userId,
        movieId
    });
    res.status(201).json(entry);    // Created - Succesful response, return JSON body
}

// Checks you are the user before returning the favourites
export async function getFavouritesHandler(req, res) {
  const { userId } = req.validated.params;  // Unpackage the userID from the request body
  const targetId = Number(userId);          // Convert the user ID into a number
  if (req.user.role !== 'admin' && req.user.sub !== targetId) {
    // Restrict viewing this unless the one making the request is the user
    // and also an admin
    throw new ForbiddenError();
  }

  // Get the favourites of the user
  const favourites = await getFavourites({ userId: targetId });
  res.json(favourites); // Return all the favourite movies as a JSON response
}

// Checks you are the user before removing a movie from your favourites
export async function deleteFavouritesHandler(req, res) {
    const { userId, tmdbId } = req.validated.params;    // Unpackage the userID from the request body
    const targetUserId = Number(userId);                // Convert the userID into a number
    const targetMovieId = await ensureMovieId(tmdbId);  // Check this movie exists

    // Attempt to remove the movie from user's favourites
    const deletedEntry = await removeFromFavourites({ userId: targetUserId, movieId: targetMovieId });
    if (!deletedEntry) {
        throw new NotFoundError("This movie is not on your Favourite's list");
    }

    res.status(204).send(); // 204 No Content - Successfully removed movie
}
