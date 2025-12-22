import request from 'supertest';
import app from '../server/src/app.js';

// Mock fetch so tests don't hit the real TMDB API
const sampleTrending = [
  { id: 1, title: 'Test Movie', poster_path: '/x.jpg', release_date: '2024-01-01' },
];

beforeAll(() => {
  global.fetch = vi.fn(async (url) => {
    if (url.toString().includes('/trending/')) {
      return {
        ok: true,
        json: async () => ({ results: sampleTrending }),
      };
    }
    return {
      ok: false,
      status: 404,
      text: async () => 'Not found',
    };
  });
});

afterAll(() => {
  global.fetch = undefined;
});

describe('health', () => {
  test('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('movies routes', () => {
  test('trending returns mocked data', async () => {
    const res = await request(app).get('/api/movies/trending?type=movie');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(sampleTrending);
  });
});
