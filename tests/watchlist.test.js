import { jest } from '@jest/globals';
import { createRequest, createResponse } from './helpers/mockHttp.js';
import { signJwt } from '../src/auth/jwt.js';

const movieStore = new Map();
const watchlistStore = [];
let watchId = 1;

const resetStores = () => {
  movieStore.clear();
  watchlistStore.length = 0;
  watchId = 1;
};

jest.unstable_mockModule('../src/services/tmdb.js', () => ({
  getContentById: async (id) => ({
    id,
    title: `Movie ${id}`,
    release_date: '2024-01-01',
    poster_path: '/poster.jpg',
  }),
  getPosterUrl: (path) => (path ? `http://image/${path}` : null),
}));

jest.unstable_mockModule('../src/db/movies.js', () => ({
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

jest.unstable_mockModule('../src/db/watchlist.js', () => ({
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
  getWatchlistEntryById: async (id) => watchlistStore.find((w) => w.id === id) ?? null,
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

const { default: watchlistRouter } = await import('../src/routes/watchlist.js');

describe('watchlist routes', () => {
  beforeEach(() => {
    resetStores();
  });

  const ownerToken = signJwt({ sub: 7, role: 'user', username: 'tester' });
  const otherToken = signJwt({ sub: 8, role: 'user', username: 'other' });
  const adminToken = signJwt({ sub: 99, role: 'admin', username: 'admin' });

  const requestRouter = async ({ method, url, body, headers = {} }) => {
    const req = createRequest({ method, url, headers });
    req.body = body;
    const res = createResponse();
    await new Promise((resolve) => {
      res.on('end', resolve);
      watchlistRouter.handle(req, res, (err) => {
        if (err) {
          errorHandler(err, req, res, () => resolve());
        } else {
          resolve();
        }
      });
    });
    return res;
  };

  test('adds to watchlist and retrieves by user', async () => {
    const resCreate = await requestRouter({
      method: 'POST',
      url: '/',
      body: { tmdbId: 1, userId: 7, status: 'planned' },
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(resCreate._getStatusCode()).toBe(201);
    expect(resCreate._getJSONData().status).toBe('planned');

    const resGet = await requestRouter({
      method: 'GET',
      url: '/7',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(resGet._getStatusCode()).toBe(200);
    expect(resGet._getJSONData()).toHaveLength(1);
  });

  test('rejects invalid status', async () => {
    const res = await requestRouter({
      method: 'POST',
      url: '/',
      body: { tmdbId: 2, userId: 7, status: 'bad' },
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(res._getStatusCode()).toBe(400);
  });

  test('updates status and deletes entry', async () => {
    const resCreate = await requestRouter({
      method: 'POST',
      url: '/',
      body: { tmdbId: 3, userId: 7, status: 'planned' },
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const id = resCreate._getJSONData().id;

    const resPut = await requestRouter({
      method: 'PUT',
      url: `/${id}`,
      body: { status: 'completed' },
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(resPut._getStatusCode()).toBe(200);
    expect(resPut._getJSONData().status).toBe('completed');

    const forbidDel = await requestRouter({
      method: 'DELETE',
      url: `/${id}`,
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    expect(forbidDel._getStatusCode()).toBe(403);

    const ownerDel = await requestRouter({
      method: 'DELETE',
      url: `/${id}`,
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(ownerDel._getStatusCode()).toBe(204);
  });

  test('admin can manage any watchlist entry', async () => {
    const resCreate = await requestRouter({
      method: 'POST',
      url: '/',
      body: { tmdbId: 4, userId: 7, status: 'planned' },
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const id = resCreate._getJSONData().id;

    const adminPut = await requestRouter({
      method: 'PUT',
      url: `/${id}`,
      body: { status: 'watching' },
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(adminPut._getStatusCode()).toBe(200);
    expect(adminPut._getJSONData().status).toBe('watching');

    const adminDel = await requestRouter({
      method: 'DELETE',
      url: `/${id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(adminDel._getStatusCode()).toBe(204);
  });
});
