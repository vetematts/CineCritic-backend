import { jest } from '@jest/globals';
import { newDb } from 'pg-mem';
import { createTables } from '../src/models/schema.js';

describe('genres model', () => {
  test('upsert genres and link to movie', async () => {
    const mem = newDb();
    const pg = mem.adapters.createPg();
    const pool = new pg.Pool();
    await createTables(pool);

    jest.unstable_mockModule('../src/models/database.js', () => ({ default: pool }));
    const { upsertMovie } = await import('../src/models/movies.js');
    const { upsertGenre, getGenreIdByTmdbId, setMovieGenres } =
      await import('../src/models/genres.js');

    const movie = await upsertMovie({
      tmdbId: 101,
      title: 'Genre Test',
      releaseYear: 2024,
      posterUrl: null,
      contentType: 'movie',
    });

    const genre = await upsertGenre({ tmdbId: 99, name: 'Action' });
    expect(genre.tmdb_id).toBe(99);
    expect(genre.name).toBe('Action');

    const genreId = await getGenreIdByTmdbId(99);
    expect(genreId).toBe(genre.id);

    await setMovieGenres(movie.id, [genreId]);

    const { rows } = await pool.query(
      'SELECT movie_id, genre_id FROM movie_genres WHERE movie_id = $1',
      [movie.id]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].genre_id).toBe(genreId);

    await pool.end();
  });
});
