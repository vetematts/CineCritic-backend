import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

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

const app = express();
app.use(express.json());
app.use('/api/reviews', reviewsRouter);

describe('reviews routes', () => {
  beforeEach(() => {
    resetStores();
  });

  test('creates and fetches a review', async () => {
    const createRes = await request(app)
      .post('/api/reviews')
      .send({ tmdbId: 101, userId: 1, rating: 4.5, body: 'Nice' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.rating).toBe(4.5);

    const listRes = await request(app).get('/api/reviews/101');
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].body).toBe('Nice');
  });

  test('rejects missing required fields', async () => {
    const res = await request(app).post('/api/reviews').send({ userId: 1, rating: 4 });
    expect(res.status).toBe(400);
  });

  test('updates a review', async () => {
    const createRes = await request(app)
      .post('/api/reviews')
      .send({ tmdbId: 202, userId: 2, rating: 3, body: 'Ok' });
    const reviewIdCreated = createRes.body.id;

    const updateRes = await request(app)
      .put(`/api/reviews/${reviewIdCreated}`)
      .send({ body: 'Better now', rating: 4 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.body).toBe('Better now');
    expect(updateRes.body.rating).toBe(4);
  });

  test('deletes a review', async () => {
    const createRes = await request(app)
      .post('/api/reviews')
      .send({ tmdbId: 303, userId: 3, rating: 5 });
    const reviewIdCreated = createRes.body.id;

    const delRes = await request(app).delete(`/api/reviews/${reviewIdCreated}`);
    expect(delRes.status).toBe(204);

    const listRes = await request(app).get('/api/reviews/303');
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(0);
  });
});
