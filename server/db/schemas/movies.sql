-- Movies table for caching TMDB metadata locally.
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
