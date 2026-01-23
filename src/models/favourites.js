import pool from './database.js';

const baseColumns = 'user_id, movie_id';

// Add a user/movie pair to the junction table.
export async function addToFavourites({ userId, movieId }) {
  const query = `
        INSERT INTO favourites (user_id, movie_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, movie_id) DO NOTHING
        RETURNING ${baseColumns};
  `;

  const { rows } = await pool.query(query, [userId, movieId]);
  const newestFavourite = rows[0]; // Inserted row (if any)
  return newestFavourite;
}

// Remove a specific user/movie pair from the junction table.
export async function removeFromFavourites({ userId, movieId }) {
  const { rowCount } = await pool.query(
    `
            DELETE FROM favourites
            WHERE (user_id, movie_id) = ($1, $2)
        `,
    [userId, movieId]
  );

  // rowCount > 0 means a favourite was removed.
  return rowCount > 0;
}

// Return all this user's favourite movies
export async function getFavourites({ userId }) {
  // Support older schemas that don't include added_at.
  let hasAddedAt = false;
  try {
    const checkResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'favourites' AND column_name = 'added_at'
    `);
    hasAddedAt = checkResult.rows.length > 0;
  } catch {
    // If the check fails, assume the column doesn't exist.
    hasAddedAt = false;
  }

  const selectAddedAt = hasAddedAt ? 'f.added_at,' : '';
  const orderBy = hasAddedAt ? 'f.added_at DESC' : 'f.movie_id DESC';

  const { rows } = await pool.query(
    `SELECT f.user_id, f.movie_id, ${selectAddedAt}
            m.title, m.poster_url, m.release_year, m.tmdb_id
       FROM favourites f
       JOIN movies m ON m.id = f.movie_id
      WHERE f.user_id = $1
      ORDER BY ${orderBy}`,
    [userId]
  );

  return rows;
}

// // Return the specific combination in the junction table
// // Used to check if this exists.
// export async function getFavouritedMovie({userId, movieId}) {
//     const {favouritedMovie} = await pool.query(`
//             SELECT f.user_id, f.movie_id
//             FROM favourites f
//             JOIN movies m ON m.id = f.movie_id
//             WHERE (f.user_id, f.movie_id) = ($1, $2)
//         `, [userId, movieId]);

//     return favouritedMovie;
// }
