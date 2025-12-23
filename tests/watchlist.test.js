import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

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

const app = express();
app.use(express.json());
app.use('/api/watchlist', watchlistRouter);

describe('watchlist routes', () => {
  beforeEach(() => {
    resetStores();
  });

  test('adds to watchlist and retrieves by user', async () => {
    const resCreate = await request(app)
      .post('/api/watchlist')
      .send({ tmdbId: 1, userId: 7, status: 'planned' });
    expect(resCreate.status).toBe(201);
    expect(resCreate.body.status).toBe('planned');

    const resGet = await request(app).get('/api/watchlist/7');
    expect(resGet.status).toBe(200);
    expect(resGet.body).toHaveLength(1);
  });

  test('rejects invalid status', async () => {
    const res = await request(app)
      .post('/api/watchlist')
      .send({ tmdbId: 2, userId: 7, status: 'bad' });
    expect(res.status).toBe(400);
  });

  test('updates status and deletes entry', async () => {
    const resCreate = await request(app)
      .post('/api/watchlist')
      .send({ tmdbId: 3, userId: 8, status: 'planned' });
    const id = resCreate.body.id;

    const resPut = await request(app).put(`/api/watchlist/${id}`).send({ status: 'completed' });
    expect(resPut.status).toBe(200);
    expect(resPut.body.status).toBe('completed');

    const resDel = await request(app).delete(`/api/watchlist/${id}`);
    expect(resDel.status).toBe(204);
  });
});
