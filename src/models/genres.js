import pool from './database.js';

const baseColumns = 'id, tmdb_id, name';

export async function upsertGenre({ tmdbId, name }) {
  const query = `
    INSERT INTO genres (tmdb_id, name)
    VALUES ($1, $2)
    ON CONFLICT (tmdb_id) DO UPDATE
      SET name = EXCLUDED.name
    RETURNING ${baseColumns};
  `;
  const { rows } = await pool.query(query, [tmdbId, name]);
  return rows[0];
}

export async function getGenreIdByTmdbId(tmdbId) {
  const { rows } = await pool.query('SELECT id FROM genres WHERE tmdb_id = $1 LIMIT 1', [tmdbId]);
  return rows[0]?.id || null;
}

export async function setMovieGenres(movieId, genreIds) {
  await pool.query('DELETE FROM movie_genres WHERE movie_id = $1', [movieId]);

  if (!genreIds?.length) {
    return;
  }

  const placeholders = genreIds.map((_, index) => `($1, $${index + 2})`).join(', ');
  const values = [movieId, ...genreIds];
  await pool.query(
    `INSERT INTO movie_genres (movie_id, genre_id)
     VALUES ${placeholders}
     ON CONFLICT DO NOTHING`,
    values
  );
}
