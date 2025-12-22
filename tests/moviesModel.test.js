import { jest } from '@jest/globals';
import { newDb } from 'pg-mem';
import { createTables } from '../server/src/db/init.js';

describe('movies model', () => {
  test('upsert and fetch by tmdb id', async () => {
    const mem = newDb();
    const pg = mem.adapters.createPg();
    const pool = new pg.Pool();
    await createTables(pool);

    jest.unstable_mockModule('../server/src/db/database.js', () => ({ default: pool }));
    const { upsertMovie, getMovieByTmdbId } = await import('../server/src/db/movies.js');

    const saved = await upsertMovie({
      tmdbId: 123,
      title: 'Test Movie',
      releaseYear: 2024,
      posterUrl: 'http://example.com/poster.jpg',
      contentType: 'movie',
    });

    expect(saved.tmdb_id).toBe(123);
    expect(saved.title).toBe('Test Movie');
    expect(saved.release_year).toBe(2024);
    expect(saved.poster_url).toBe('http://example.com/poster.jpg');
    expect(saved.content_type).toBe('movie');

    const fetched = await getMovieByTmdbId(123);
    expect(fetched).not.toBeNull();
    expect(fetched.title).toBe('Test Movie');

    await pool.end();
  });
});
