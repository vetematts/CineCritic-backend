import pool from './database.js';

/**
 * Add a movie like for a user.
 * Enforces one like per user and movie via a unique database constraint.
 * @param {object} input
 * @param {number} input.userId
 * @param {number} input.movieId
 * @returns {Promise<object>} Created like row
 */
export async function addMovieLike({ userId, movieId }) {
  const query = `
    INSERT INTO movie_likes (user_id, movie_id)
    VALUES ($1, $2)
    RETURNING id, user_id, movie_id, created_at;
  `;
  const { rows } = await pool.query(query, [userId, movieId]);
  return rows[0];
}

/**
 * Remove a movie like for the given user and movie.
 * @param {object} input
 * @param {number} input.userId
 * @param {number} input.movieId
 * @returns {Promise<boolean>} True if a like was removed
 */
export async function removeMovieLike({ userId, movieId }) {
  const { rowCount } = await pool.query(
    'DELETE FROM movie_likes WHERE user_id = $1 AND movie_id = $2',
    [userId, movieId]
  );
  return rowCount > 0;
}

/**
 * Return movies ranked by likes received within a recent time window.
 * @param {object} input
 * @param {number} input.days Number of days in the ranking window
 * @param {number} input.limit Maximum number of movies to return
 * @returns {Promise<object[]>} Ranked movie summaries with like counts
 */
export async function getTrendingMoviesByRecentLikes({ days = 30, limit = 20 }) {
  // Keep query inputs bounded to avoid extreme windows or payload sizes.
  const safeDays = Math.max(1, Math.min(90, Number(days)));
  const safeLimit = Math.max(1, Math.min(50, Number(limit)));
  const query = `
    SELECT
      m.id,
      m.tmdb_id,
      m.title,
      m.release_year,
      m.poster_url,
      m.content_type,
      COUNT(ml.id)::INT AS likes_last_window,
      MAX(ml.created_at) AS latest_like_at
    FROM movie_likes ml
    JOIN movies m ON m.id = ml.movie_id
    -- Only include likes within the rolling N-day window.
    WHERE ml.created_at >= NOW() - make_interval(days => $1::int)
    GROUP BY m.id
    -- Break ties by most recent like so results feel fresh.
    ORDER BY likes_last_window DESC, latest_like_at DESC
    LIMIT $2;
  `;
  const { rows } = await pool.query(query, [safeDays, safeLimit]);
  return rows;
}
