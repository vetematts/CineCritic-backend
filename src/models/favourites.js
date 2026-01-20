import pool from './database.js';

const baseColumns = 'id, user_id, movie_id';

// Get the user's ID and add the movie ID they favourited to the 
// junction table
export async function addToFavourites({userID, movieID}) {
    const query = `
        INSERT INTO favourites (user_id, movie_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, movie_id) DO NOTHING
        RETURNING ${baseColumns};
    `;

    const {rows} = await pool.query(query, [userID, movieID]);
    const newestFavourite = rows[0];    // Latest addition appears at the top of the table
    return newestFavourite;
}

// Get the user's ID and the movie ID and remove specifically the 
// movieID/userID combination from the junction table
export async function removeFromFavourites({userID, movieID}) {
    const {removedRowQty} = await pool.query(`
            DELETE FROM favourites 
            WHERE (user_id, movie_id) = ($1, $2)
        `, [userID, movieID]);
    
    // Check that a row has been deleted from
    // If a row has been removed this should be 1 or greater
    // Favourites will usually be removed one movie at a time
    return removedRowQty > 0;
}

// Return all this user's favourite movies
export async function getFavourites({userID}) {
    // Apply a JOIN ON movies to find all userid-movieid key pairs
    //  that exist in this table
    const {rows} = await pool.query(`
            SELECT f.user_id, f.movie_id, m.title
            FROM favourites f
            JOIN movies m ON m.id = f.movie_id
            WHERE f.user_id = $1
            ORDER BY m.title DESC
        `, [userID]);

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