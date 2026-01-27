import { ForbiddenError, NotFoundError } from '../errors/http.js';
import { ensureMovieId } from './watchlistController.js';

import { addToFavourites, getFavourites, removeFromFavourites } from '../models/favourites.js';

export async function addToFavouritesHandler(req, res) {
  const { userId, tmdbId } = req.validated.body; // Extract userId and tmdbId from the request body
  const targetId = Number(userId);
  if (req.user.role !== 'admin' && req.user.sub !== targetId) {
    // Only the owner or an admin can add favourites.
    throw new ForbiddenError();
  }

  const movieId = await ensureMovieId(tmdbId);
  const entry = await addToFavourites({
    userId,
    movieId,
  });
  res.status(201).json(entry); // Created - Successful response
}

export async function getFavouritesHandler(req, res) {
  const { userId } = req.validated.params; // Extract userId from params
  const targetId = Number(userId);
  if (req.user.role !== 'admin' && req.user.sub !== targetId) {
    // Only the owner or an admin can view favourites.
    throw new ForbiddenError();
  }

  const favourites = await getFavourites({ userId: targetId });
  res.json(favourites);
}

export async function getFavouritesPublicHandler(req, res) {
  const { userId } = req.validated.params;
  const targetId = Number(userId);
  const favourites = await getFavourites({ userId: targetId });
  res.json(favourites);
}

export async function deleteFavouritesHandler(req, res) {
  const { userId, tmdbId } = req.validated.params; // Extract userId and tmdbId from params
  const targetUserId = Number(userId);
  const targetMovieId = await ensureMovieId(tmdbId);

  const deletedEntry = await removeFromFavourites({ userId: targetUserId, movieId: targetMovieId });
  if (!deletedEntry) {
    throw new NotFoundError('This movie is not on your favourites list');
  }

  res.status(204).send();
}
