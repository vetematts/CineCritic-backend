import { jest } from '@jest/globals';
import moviesRouter from '../src/routes/movies.js';
import { createRequest, createResponse } from './helpers/mockHttp.js';

// Mock fetch so tests don't hit the real TMDB API
const sampleTrending = [
  { id: 1, title: 'Test Movie', poster_path: '/x.jpg', release_date: '2024-01-01' },
];
const sampleSearch = [
  { id: 2, title: 'Search Movie', poster_path: '/s.jpg', release_date: '2023-02-02' },
];

beforeAll(() => {
  global.fetch = jest.fn(async (url) => {
    const urlStr = url.toString();
    if (urlStr.includes('/trending/')) {
      return {
        ok: true,
        json: async () => ({ results: sampleTrending }),
      };
    }
    if (urlStr.includes('/search/')) {
      return {
        ok: true,
        json: async () => ({ results: sampleSearch }),
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

async function runRouter(method, url, { query } = {}) {
  const req = createRequest({ method, url, query });
  const res = createResponse();

  return new Promise((resolve, reject) => {
    res.on('end', () => resolve(res));
    moviesRouter.handle(req, res, (err) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

describe('health', () => {
  test('returns ok', async () => {
    const req = createRequest({ method: 'GET', url: '/health' });
    const res = createResponse();
    const { default: app } = await import('../src/app/app.js');
    await new Promise((resolve, reject) => {
      res.on('end', () => resolve());
      app.handle(req, res, (err) => {
        if (err) reject(err);
      });
    });
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ status: 'ok' });
  });
});

describe('movies routes', () => {
  test('trending returns mocked data', async () => {
    const res = await runRouter('GET', '/trending', { query: { type: 'movie' } });
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(sampleTrending);
  });

  test('search requires query', async () => {
    const res = await runRouter('GET', '/search');
    expect(res._getStatusCode()).toBe(400);
  });

  test('search returns mocked data', async () => {
    const res = await runRouter('GET', '/search', { query: { q: 'test', type: 'movie' } });
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(sampleSearch);
  });
});
