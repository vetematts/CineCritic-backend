import { BadRequestError } from '../errors/http.js';
import {
  getTrending,
  getTopRated,
  getContentByYear,
  getContentByGenre,
  getContentById,
  getCachedGenres,
  searchContent,
  getPosterUrl,
  discoverMovies,
} from '../services/tmdb.js';
import { upsertMovie } from '../db/movies.js';

export async function getTrendingHandler(req, res, next) {
  try {
    const results = await getTrending('movie');
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function getTopRatedHandler(req, res, next) {
  try {
    const results = await getTopRated('movie');
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function getGenresHandler(req, res, next) {
  try {
    const genres = await getCachedGenres('movie');
    res.json(genres);
  } catch (err) {
    next(err);
  }
}

export async function getByYearHandler(req, res, next) {
  try {
    const { year } = req.params;
    const { sortBy = 'popularity.desc', limit = 20 } = req.query;
    const results = await getContentByYear(Number(year), 'movie', sortBy, Number(limit));
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function getByGenreHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { sortBy = 'popularity.desc', page = 1 } = req.query;
    const results = await getContentByGenre(Number(id), 'movie', sortBy, Number(page));
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function searchHandler(req, res, next) {
  try {
    const { q = '', page = 1 } = req.query;
    if (!q) {
      throw new BadRequestError('Query parameter q is required');
    }
    const results = await searchContent(q, 'movie', Number(page));
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function advancedSearchHandler(req, res, next) {
  try {
    const { parsed } = req;
    const results = await discoverMovies({
      query: parsed.query,
      year: parsed.year,
      genres: parsed.genres,
      ratingMin: parsed.ratingMin,
      ratingMax: parsed.ratingMax,
      crewName: parsed.crew,
      page: parsed.page,
    });
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function getByIdHandler(req, res, next) {
  try {
    const { id } = req.params;
    const result = await getContentById(Number(id), 'movie');

    const releaseYear = result.release_date ? new Date(result.release_date).getFullYear() : null;
    await upsertMovie({
      tmdbId: result.id,
      title: result.title,
      releaseYear,
      posterUrl: getPosterUrl(result.poster_path),
      contentType: 'movie',
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}
