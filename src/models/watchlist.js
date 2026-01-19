import pool from './database.js';

const baseColumns = 'id, user_id, movie_id, status, added_at';

export async function addToWatchlist({ userId, movieId, status = 'planned' }) {
  // Keep one row per user/movie pair and update the status on conflict.
  const query = `
    INSERT INTO watchlist (user_id, movie_id, status)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, movie_id) DO UPDATE
      SET status = EXCLUDED.status
    RETURNING ${baseColumns};
  `;
  const { rows } = await pool.query(query, [userId, movieId, status]);
  return rows[0];
}

export async function getWatchlistByUser(userId) {
  const { rows } = await pool.query(
    `SELECT w.id, w.user_id, w.movie_id, w.status, w.added_at,
            m.title, m.poster_url, m.release_year, m.tmdb_id
       FROM watchlist w
       JOIN movies m ON m.id = w.movie_id
      WHERE w.user_id = $1
      ORDER BY w.added_at DESC`,
    [userId]
  );
  return rows;
}

export async function updateWatchStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE watchlist
        SET status = $2
      WHERE id = $1
    RETURNING ${baseColumns};`,
    [id, status]
  );
  return rows[0] || null;
}

// Delete a watchlist entry and return whether a row was actually removed.
export async function removeFromWatchlist(id) {
  const { rowCount } = await pool.query('DELETE FROM watchlist WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function getWatchlistEntryById(id) {
  const { rows } = await pool.query(
    `SELECT id, user_id, movie_id, status, added_at
       FROM watchlist
      WHERE id = $1
      LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}
