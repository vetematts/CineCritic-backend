import { getContentById, getPosterUrl } from '../services/tmdb.js';
import { upsertMovie, getMovieIdByTmdbId } from '../models/movies.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors/http.js';
import { getFavourites } from '../models/favourites.js';

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
  const favourites = await getFavourites(targetId);
  res.json(favourites); // Return all the favourite movies as a JSON response
}