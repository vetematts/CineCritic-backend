-- Master schema. Keep in sync with per-table files under server/db/schemas/.
\echo 'Applying movies schema...'

-- movies
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
