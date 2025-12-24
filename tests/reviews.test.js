import { jest } from '@jest/globals';
import { createRequest, createResponse } from './helpers/mockHttp.js';
import { signJwt } from '../server/src/auth/jwt.js';

// In-memory stores for mocks
const movieStore = new Map();
const reviewsStore = [];
let reviewId = 1;

const resetStores = () => {
  movieStore.clear();
  reviewsStore.length = 0;
  reviewId = 1;
};

// Mock TMDB client
jest.unstable_mockModule('../server/src/tmdb.js', () => ({
  getContentById: async (id) => ({
    id,
    title: `Movie ${id}`,
    release_date: '2024-01-01',
    poster_path: '/poster.jpg',
  }),
  getPosterUrl: (path) => (path ? `http://image/${path}` : null),
}));

// Mock movie cache helpers
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

// Mock reviews repo
jest.unstable_mockModule('../server/src/db/reviews.js', () => ({
  createReview: async ({ userId, movieId, rating, body, status }) => {
    const review = {
      id: reviewId++,
      user_id: userId,
      movie_id: movieId,
      rating,
      body: body ?? null,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    reviewsStore.push(review);
    return review;
  },
  getReviewsByMovie: async (movieId) => reviewsStore.filter((r) => r.movie_id === movieId),
  getReviewById: async (id) => reviewsStore.find((r) => r.id === id) ?? null,
  updateReview: async (id, fields) => {
    const review = reviewsStore.find((r) => r.id === id);
    if (!review) return null;
    if (fields.rating !== undefined) review.rating = fields.rating;
    if (fields.body !== undefined) review.body = fields.body;
    if (fields.status !== undefined) review.status = fields.status;
    review.updated_at = new Date().toISOString();
    return review;
  },
  deleteReview: async (id) => {
    const idx = reviewsStore.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    reviewsStore.splice(idx, 1);
    return true;
  },
}));

const { default: reviewsRouter } = await import('../server/src/routes/reviews.js');

describe('reviews routes', () => {
  beforeEach(() => {
    resetStores();
  });

  const authorToken = signJwt({ sub: 1, role: 'user', username: 'tester' });
  const otherToken = signJwt({ sub: 2, role: 'user', username: 'other' });
  const adminToken = signJwt({ sub: 99, role: 'admin', username: 'admin' });

  const requestRouter = async ({ method, url, body, headers = {} }) => {
    const req = createRequest({ method, url, headers });
    req.body = body;
    const res = createResponse();
    await new Promise((resolve, reject) => {
      res.on('end', resolve);
      reviewsRouter.handle(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    return res;
  };

  test('creates and fetches a review', async () => {
    const createRes = await requestRouter({
      method: 'POST',
      url: '/',
      body: { tmdbId: 101, userId: 1, rating: 4.5, body: 'Nice' },
      headers: { Authorization: `Bearer ${authorToken}` },
    });
    expect(createRes._getStatusCode()).toBe(201);
    const created = createRes._getJSONData();
    expect(created.rating).toBe(4.5);

    const listRes = await requestRouter({ method: 'GET', url: '/101' });
    expect(listRes._getStatusCode()).toBe(200);
    const list = listRes._getJSONData();
    expect(list).toHaveLength(1);
    expect(list[0].body).toBe('Nice');
  });

  test('rejects missing required fields', async () => {
    const res = await requestRouter({
      method: 'POST',
      url: '/',
      body: { userId: 1, rating: 4 },
      headers: { Authorization: `Bearer ${authorToken}` },
    });
    expect(res._getStatusCode()).toBe(400);
  });

  test('updates a review', async () => {
    const createRes = await requestRouter({
      method: 'POST',
      url: '/',
      body: { tmdbId: 202, userId: 1, rating: 3, body: 'Ok' },
      headers: { Authorization: `Bearer ${authorToken}` },
    });
    const reviewIdCreated = createRes._getJSONData().id;

    const updateRes = await requestRouter({
      method: 'PUT',
      url: `/${reviewIdCreated}`,
      body: { body: 'Better now', rating: 4 },
      headers: { Authorization: `Bearer ${authorToken}` },
    });
    expect(updateRes._getStatusCode()).toBe(200);
    const updated = updateRes._getJSONData();
    expect(updated.body).toBe('Better now');
    expect(updated.rating).toBe(4);
  });

  test('prevents non-owner from updating and allows admin', async () => {
    const createRes = await requestRouter({
      method: 'POST',
      url: '/',
      body: { tmdbId: 250, userId: 1, rating: 4 },
      headers: { Authorization: `Bearer ${authorToken}` },
    });
    const reviewIdCreated = createRes._getJSONData().id;

    const forbid = await requestRouter({
      method: 'PUT',
      url: `/${reviewIdCreated}`,
      body: { body: 'nope' },
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    expect(forbid._getStatusCode()).toBe(403);

    const allow = await requestRouter({
      method: 'PUT',
      url: `/${reviewIdCreated}`,
      body: { body: 'admin edit' },
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(allow._getStatusCode()).toBe(200);
    expect(allow._getJSONData().body).toBe('admin edit');
  });

  test('deletes a review with owner or admin', async () => {
    const createRes = await requestRouter({
      method: 'POST',
      url: '/',
      body: { tmdbId: 303, userId: 1, rating: 5 },
      headers: { Authorization: `Bearer ${authorToken}` },
    });
    const reviewIdCreated = createRes._getJSONData().id;

    const forbid = await requestRouter({
      method: 'DELETE',
      url: `/${reviewIdCreated}`,
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    expect(forbid._getStatusCode()).toBe(403);

    const ownerDel = await requestRouter({
      method: 'DELETE',
      url: `/${reviewIdCreated}`,
      headers: { Authorization: `Bearer ${authorToken}` },
    });
    expect(ownerDel._getStatusCode()).toBe(204);

    const recreate = await requestRouter({
      method: 'POST',
      url: '/',
      body: { tmdbId: 303, userId: 1, rating: 5 },
      headers: { Authorization: `Bearer ${authorToken}` },
    });
    const id2 = recreate._getJSONData().id;

    const adminDel = await requestRouter({
      method: 'DELETE',
      url: `/${id2}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(adminDel._getStatusCode()).toBe(204);

    const listRes = await requestRouter({ method: 'GET', url: '/303' });
    expect(listRes._getStatusCode()).toBe(200);
    expect(listRes._getJSONData()).toHaveLength(0);
  });
});
