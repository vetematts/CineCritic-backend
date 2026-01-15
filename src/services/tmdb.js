import { config } from '../config/index.js';

const TMDB_API_KEY = config.tmdbApiKey;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const responseCache = new Map();

async function fetchFromTMDB(endpoint, params = {}) {
  // Use a short-lived cache to reduce repeated TMDB calls.
  if (!TMDB_API_KEY) {
    const error = new Error('TMDB_API_KEY is not set');
    error.status = 500;
    throw error;
  }

  const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', TMDB_API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    // Retry once if TMDB is rate limiting requests.
    if (response.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return fetchFromTMDB(endpoint, params);
    }

    const errorText = await response.text();
    const error = new Error(`TMDB API error: ${response.status} - ${errorText}`);
    error.status = response.status;
    throw error;
  }

  const json = await response.json();

  responseCache.set(cacheKey, { data: json, expiresAt: Date.now() + CACHE_TTL_MS });
  return json;
}

export function getPosterUrl(path, size = 'w500') {
  // Build a full TMDB image URL from the poster path.
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

export async function getTrending(contentType = 'movie') {
  const data = await fetchFromTMDB(`/trending/${contentType}/week`);
  return data.results;
}

export async function getTopRated(contentType = 'movie') {
  const data = await fetchFromTMDB(`/${contentType}/top_rated`);
  return data.results;
}

export async function getContentByYear(
  year,
  contentType = 'movie',
  sortBy = 'popularity.desc',
  limit = 20
) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const dateField = contentType === 'movie' ? 'primary_release_date' : 'first_air_date';

  const data = await fetchFromTMDB(`/discover/${contentType}`, {
    [`${dateField}.gte`]: startDate,
    [`${dateField}.lte`]: endDate,
    sort_by: sortBy,
    page: '1',
    'vote_count.gte': '50',
  });

  return data.results.slice(0, limit);
}

export async function getContentByGenre(
  genreId,
  contentType = 'movie',
  sortBy = 'popularity.desc',
  page = 1
) {
  const data = await fetchFromTMDB(`/discover/${contentType}`, {
    with_genres: genreId.toString(),
    sort_by: sortBy,
    page: page.toString(),
  });

  return data.results;
}

export async function getContentById(id, contentType = 'movie') {
  return fetchFromTMDB(`/${contentType}/${id}`, { append_to_response: 'credits,similar' });
}

export async function getGenres(contentType = 'movie') {
  const data = await fetchFromTMDB(`/genre/${contentType}/list`);
  return data.genres;
}

export async function searchContent(query, contentType = 'movie', page = 1) {
  const data = await fetchFromTMDB(`/search/${contentType}`, {
    query,
    page: page.toString(),
    include_adult: 'false',
  });
  return data.results;
}

// Simple in-memory cache for genres
const genreCache = {};

export async function getCachedGenres(contentType = 'movie') {
  // Cache the genre list in memory to avoid extra TMDB calls.
  if (genreCache[contentType]) {
    return genreCache[contentType];
  }
  const genres = await getGenres(contentType);
  genreCache[contentType] = genres;
  return genres;
}

export async function searchPerson(name) {
  const data = await fetchFromTMDB(`/search/person`, {
    query: name,
    page: '1',
    include_adult: 'false',
  });
  return data.results?.[0] || null;
}

export async function discoverMovies({
  query,
  year,
  genres,
  ratingMin,
  ratingMax,
  crewName,
  page = 1,
}) {
  // If a crew name is provided, resolve it to a TMDB person id first.
  let withPeople;
  if (crewName) {
    const person = await searchPerson(crewName);
    if (person?.id) {
      withPeople = person.id;
    } else {
      return [];
    }
  }

  const params = {
    page: page.toString(),
    include_adult: 'false',
    'vote_count.gte': '50',
  };

  if (query) {
    params.query = query;
    const data = await fetchFromTMDB('/search/movie', params);
    return data.results;
  }

  if (year) {
    params['primary_release_year'] = year.toString();
  }
  if (genres?.length) {
    params.with_genres = genres.join(',');
  }
  if (withPeople) {
    params.with_people = withPeople.toString();
  }
  if (ratingMin !== undefined) {
    params['vote_average.gte'] = ratingMin.toString();
  }
  if (ratingMax !== undefined) {
    params['vote_average.lte'] = ratingMax.toString();
  }

  const data = await fetchFromTMDB('/discover/movie', params);
  return data.results;
}
