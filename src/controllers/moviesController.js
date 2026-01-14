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
import { upsertMovie } from '../models/movies.js';
import { setMovieGenres, upsertGenre } from '../models/genres.js';

export async function getTrendingHandler(req, res) {
  const results = await getTrending('movie');
  res.json(results);
}

export async function getTopRatedHandler(req, res) {
  const results = await getTopRated('movie');
  res.json(results);
}

export async function getGenresHandler(req, res) {
  const genres = await getCachedGenres('movie');
  res.json(genres);
}

export async function getByYearHandler(req, res) {
  const { year } = req.params;
  const { sortBy = 'popularity.desc', limit = 20 } = req.query;
  const results = await getContentByYear(Number(year), 'movie', sortBy, Number(limit));
  res.json(results);
}

export async function getByGenreHandler(req, res) {
  const { id } = req.params;
  const { sortBy = 'popularity.desc', page = 1 } = req.query;
  const results = await getContentByGenre(Number(id), 'movie', sortBy, Number(page));
  res.json(results);
}

export async function searchHandler(req, res) {
  const { q = '', page = 1 } = req.query;
  if (!q) {
    throw new BadRequestError('Query parameter q is required');
  }
  const results = await searchContent(q, 'movie', Number(page));
  res.json(results);
}

export async function advancedSearchHandler(req, res) {
  const { parsed } = req;
  // Use validated query params from the middleware to build TMDB discover filters.
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
}

export async function getByIdHandler(req, res) {
  const { id } = req.params;
  const result = await getContentById(Number(id), 'movie');

  const releaseYear = result.release_date ? new Date(result.release_date).getFullYear() : null;
  const movieRow = await upsertMovie({
    tmdbId: result.id,
    title: result.title,
    releaseYear,
    posterUrl: getPosterUrl(result.poster_path),
    contentType: 'movie',
  });

  if (Array.isArray(result.genres) && result.genres.length) {
    // Persist TMDB genres and link them to the cached movie.
    const genreRows = await Promise.all(
      result.genres.map((genre) =>
        upsertGenre({
          tmdbId: genre.id,
          name: genre.name,
        })
      )
    );
    const genreIds = genreRows.map((genre) => genre.id);
    await setMovieGenres(movieRow.id, genreIds);
  }

  res.json(result);
}
