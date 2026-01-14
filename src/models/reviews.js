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
    `SELECT id, user_id, movie_id, rating, body, status, created_at, updated_at, published_at, flagged_at
     FROM reviews
     WHERE movie_id = $1
     ORDER BY created_at DESC`,
    [movieId]
  );
  return rows;
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
