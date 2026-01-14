import pool from './database.js';

// Create core tables. Accepts an optional pool for tests (e.g., pg-mem).
export async function createTables(dbPool = pool) {
  try {
    await dbPool.query("CREATE TYPE review_status_enum AS ENUM ('draft', 'published', 'flagged');");
  } catch (err) {
    // Ignore if the enum already exists.
    if (err.code !== '42710') {
      throw err;
    }
  }

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT ck_users_role CHECK (role IN ('user', 'admin'))
    );

    CREATE TABLE IF NOT EXISTS movies (
      id SERIAL PRIMARY KEY,
      tmdb_id INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL,
      release_year INTEGER,
      poster_url TEXT,
      content_type VARCHAR(10) NOT NULL DEFAULT 'movie',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT ck_movies_content_type CHECK (content_type IN ('movie', 'tv'))
    );

    CREATE TABLE IF NOT EXISTS genres (
      id SERIAL PRIMARY KEY,
      tmdb_id INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS movie_genres (
      movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
      genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
      PRIMARY KEY (movie_id, genre_id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      rating NUMERIC(2,1) NOT NULL,
      body TEXT,
      status review_status_enum NOT NULL DEFAULT 'draft',
      movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      published_at TIMESTAMPTZ,
      flagged_at TIMESTAMPTZ,
      CONSTRAINT ck_review_rating CHECK (rating IN (0.5,1.0,1.5,2.0,2.5,3.0,3.5,4.0,4.5,5.0)),
      CONSTRAINT ck_review_published_time CHECK (status <> 'published' OR published_at IS NOT NULL)
    );

    CREATE TABLE IF NOT EXISTS watchlist (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'planned',
      added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_watchlist_user_movie UNIQUE (user_id, movie_id)
    );
  `);

  await dbPool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS favourite_movie_id INTEGER REFERENCES movies(id) ON DELETE SET NULL;
  `);
}
