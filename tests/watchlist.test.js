import { jest } from '@jest/globals';
import { createRequest, createResponse } from './helpers/mockHttp.js';

const movieStore = new Map();
const watchlistStore = [];
let watchId = 1;

const resetStores = () => {
  movieStore.clear();
  watchlistStore.length = 0;
  watchId = 1;
};

jest.unstable_mockModule('../server/src/tmdb.js', () => ({
  getContentById: async (id) => ({
    id,
    title: `Movie ${id}`,
    release_date: '2024-01-01',
    poster_path: '/poster.jpg',
  }),
  getPosterUrl: (path) => (path ? `http://image/${path}` : null),
}));

jest.unstable_mockModule('../server/src/db/movies.js', () => ({
  getMovieIdByTmdbId: async (tmdbId) => movieStore.get(Number(tmdbId)) ?? null,
  upsertMovie: async ({ tmdbId, title, releaseYear, posterUrl, contentType }) => {
    const key = Number(tmdbId);
    let id = movieStore.get(key);
    if (!id) {
      id = movieStore.size + 1;
      movieStore.set(key, id);
    }
    return {
      id,
      tmdb_id: key,
      title,
      release_year: releaseYear,
      poster_url: posterUrl,
      content_type: contentType,
      created_at: new Date().toISOString(),
    };
  },
}));

jest.unstable_mockModule('../server/src/db/watchlist.js', () => ({
  addToWatchlist: async ({ userId, movieId, status }) => {
    const existing = watchlistStore.find((w) => w.user_id === userId && w.movie_id === movieId);
    if (existing) {
      existing.status = status;
      return existing;
    }
    const entry = {
      id: watchId++,
      user_id: userId,
      movie_id: movieId,
      status,
      added_at: new Date().toISOString(),
    };
    watchlistStore.push(entry);
    return entry;
  },
  getWatchlistByUser: async (userId) => watchlistStore.filter((w) => w.user_id === userId),
  updateWatchStatus: async (id, status) => {
    const entry = watchlistStore.find((w) => w.id === id);
    if (!entry) return null;
    entry.status = status;
    return entry;
  },
  removeFromWatchlist: async (id) => {
    const idx = watchlistStore.findIndex((w) => w.id === id);
    if (idx === -1) return false;
    watchlistStore.splice(idx, 1);
    return true;
  },
}));

const { default: watchlistRouter } = await import('../server/src/routes/watchlist.js');

describe('watchlist routes', () => {
  beforeEach(() => {
    resetStores();
  });

  const requestRouter = async ({ method, url, body }) => {
    const req = createRequest({ method, url });
    req.body = body;
    const res = createResponse();
    await new Promise((resolve, reject) => {
      res.on('end', resolve);
      watchlistRouter.handle(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    return res;
  };

  test('adds to watchlist and retrieves by user', async () => {
    const resCreate = await requestRouter({
      method: 'POST',
      url: '/',
      body: { tmdbId: 1, userId: 7, status: 'planned' },
    });
    expect(resCreate._getStatusCode()).toBe(201);
    expect(resCreate._getJSONData().status).toBe('planned');

    const resGet = await requestRouter({ method: 'GET', url: '/7' });
    expect(resGet._getStatusCode()).toBe(200);
    expect(resGet._getJSONData()).toHaveLength(1);
  });

  test('rejects invalid status', async () => {
    const res = await requestRouter({
      method: 'POST',
      url: '/',
      body: { tmdbId: 2, userId: 7, status: 'bad' },
    });
    expect(res._getStatusCode()).toBe(400);
  });

  test('updates status and deletes entry', async () => {
    const resCreate = await requestRouter({
      method: 'POST',
      url: '/',
      body: { tmdbId: 3, userId: 8, status: 'planned' },
    });
    const id = resCreate._getJSONData().id;

    const resPut = await requestRouter({
      method: 'PUT',
      url: `/${id}`,
      body: { status: 'completed' },
    });
    expect(resPut._getStatusCode()).toBe(200);
    expect(resPut._getJSONData().status).toBe('completed');

    const resDel = await requestRouter({ method: 'DELETE', url: `/${id}` });
    expect(resDel._getStatusCode()).toBe(204);
  });
});
