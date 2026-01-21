import pool from './database.js';

export async function createReview({ userId, movieId, rating, body, status = 'published' }) {
  const query = `
    INSERT INTO reviews (user_id, movie_id, rating, body, status, published_at)
    VALUES ($1, $2, $3, $4, $5, CASE WHEN $6 = 'published' THEN NOW() ELSE NULL END)
    RETURNING id, user_id, movie_id, rating, body, status, created_at, updated_at, published_at, flagged_at;
  `;
  const values = [userId, movieId, rating, body ?? null, status, status];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function getReviewsByMovie(movieId) {
  const { rows } = await pool.query(
    `SELECT
       r.id,
       r.user_id,
       r.movie_id,
       r.rating,
       r.body,
       r.status,
       r.created_at,
       r.updated_at,
       r.published_at,
       r.flagged_at,
       u.username,
       u.email
     FROM reviews r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.movie_id = $1
     ORDER BY r.created_at DESC`,
    [movieId]
  );
  // Format the response to include user object for consistency
  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    movie_id: row.movie_id,
    rating: row.rating,
    body: row.body,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at,
    flagged_at: row.flagged_at,
    user: row.username
      ? {
          id: row.user_id,
          username: row.username,
          email: row.email,
        }
      : null,
    username: row.username, // Also include at top level for easier access
  }));
}

export async function getReviewById(id) {
  const { rows } = await pool.query(
    `SELECT id, user_id, movie_id, rating, body, status, created_at, updated_at, published_at, flagged_at
     FROM reviews
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function updateReview(id, fields) {
  // Build an update query only for fields that were provided.
  const updates = [];
  const values = [];
  let idx = 1;

  if (fields.rating !== undefined) {
    updates.push(`rating = $${idx++}`);
    values.push(fields.rating);
  }
  if (fields.body !== undefined) {
    updates.push(`body = $${idx++}`);
    values.push(fields.body);
  }
  if (fields.status !== undefined) {
    updates.push(`status = $${idx++}`);
    values.push(fields.status);
    if (fields.status === 'published') {
      updates.push('published_at = NOW()');
    }
  }

  if (!updates.length) {
    return null;
  }

  values.push(id);
  const query = `
    UPDATE reviews
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING id, user_id, movie_id, rating, body, status, created_at, updated_at, published_at, flagged_at;
  `;
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

export async function deleteReview(id) {
  const { rowCount } = await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function getReviewsByUser(userId) {
  const { rows } = await pool.query(
    `SELECT
       r.id,
       r.user_id,
       r.movie_id,
       r.rating,
       r.body,
       r.status,
       r.created_at,
       r.updated_at,
       r.published_at,
       r.flagged_at,
       m.tmdb_id,
       m.title,
       m.poster_url,
       m.release_year
     FROM reviews r
     JOIN movies m ON r.movie_id = m.id
     WHERE r.user_id = $1 AND r.status = 'published'
     ORDER BY r.published_at DESC, r.created_at DESC`,
    [userId]
  );
  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    movie_id: row.movie_id,
    rating: row.rating,
    body: row.body,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at,
    flagged_at: row.flagged_at,
    movie: {
      tmdb_id: row.tmdb_id,
      title: row.title,
      poster_url: row.poster_url,
      release_year: row.release_year,
    },
  }));
}
