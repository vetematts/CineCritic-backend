import pool from './database.js';

const baseColumns =
  'tmdb_id, title, release_year, poster_url, content_type, created_at';

export async function upsertMovie({ tmdbId, title, releaseYear, posterUrl, contentType = 'movie' }) {
  const query = `
    INSERT INTO movies (tmdb_id, title, release_year, poster_url, content_type)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (tmdb_id) DO UPDATE
      SET title = EXCLUDED.title,
          release_year = EXCLUDED.release_year,
          poster_url = EXCLUDED.poster_url,
          content_type = EXCLUDED.content_type
    RETURNING ${baseColumns};
  `;
  const values = [tmdbId, title, releaseYear ?? null, posterUrl ?? null, contentType];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function getMovieByTmdbId(tmdbId) {
  const { rows } = await pool.query(
    `SELECT ${baseColumns} FROM movies WHERE tmdb_id = $1 LIMIT 1`,
    [tmdbId]
  );
  return rows[0] || null;
}
