import crypto from 'crypto';
import pool from './database.js';
import { createTables } from './init.js';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function upsertUser({ username, email, password, role = 'user' }) {
  const passwordHash = hashPassword(password);
  const insertSql = `
    INSERT INTO users (username, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email) DO NOTHING
    RETURNING id;
  `;
  const { rows } = await pool.query(insertSql, [username, email, passwordHash, role]);
  if (rows[0]) return rows[0].id;

  const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [
    email,
  ]);
  return existing[0].id;
}

async function upsertMovie({ tmdbId, title, releaseYear, posterUrl, contentType = 'movie' }) {
  const insertSql = `
    INSERT INTO movies (tmdb_id, title, release_year, poster_url, content_type)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (tmdb_id) DO NOTHING
    RETURNING id;
  `;
  const { rows } = await pool.query(insertSql, [
    tmdbId,
    title,
    releaseYear,
    posterUrl,
    contentType,
  ]);
  if (rows[0]) return rows[0].id;

  const { rows: existing } = await pool.query('SELECT id FROM movies WHERE tmdb_id = $1 LIMIT 1', [
    tmdbId,
  ]);
  return existing[0].id;
}

async function addReview({ userId, movieId, rating, body, status = 'published' }) {
  await pool.query(
    `
    INSERT INTO reviews (rating, body, status, movie_id, user_id, published_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT DO NOTHING;
  `,
    [rating, body, status, movieId, userId]
  );
}

async function addWatchlist({ userId, movieId, status = 'planned' }) {
  await pool.query(
    `
    INSERT INTO watchlist (user_id, movie_id, status)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, movie_id) DO NOTHING;
  `,
    [userId, movieId, status]
  );
}

async function seed() {
  await createTables();

  const adminId = await upsertUser({
    username: 'admin',
    email: 'admin@example.com',
    password: 'adminpass',
    role: 'admin',
  });

  const userId = await upsertUser({
    username: 'demo',
    email: 'demo@example.com',
    password: 'demopass',
    role: 'user',
  });

  const jayId = await upsertUser({
    username: 'jay_son',
    email: 'jay.son@payload.dev',
    password: 'json123',
    role: 'user',
  });

  const fightClubId = await upsertMovie({
    tmdbId: 550,
    title: 'Fight Club',
    releaseYear: 1999,
    posterUrl: '/a26cQPRhJPX6GbWfQbvZdrrp9j9.jpg',
  });

  const duneId = await upsertMovie({
    tmdbId: 438631,
    title: 'Dune: Part Two',
    releaseYear: 2024,
    posterUrl: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
  });

  const rushHourId = await upsertMovie({
    tmdbId: 2109,
    title: 'Rush Hour',
    releaseYear: 1998,
    posterUrl: null,
  });

  const jasonBourneId = await upsertMovie({
    tmdbId: 324668,
    title: 'Jason Bourne',
    releaseYear: 2016,
    posterUrl: null,
  });

  const freddyVsJasonId = await upsertMovie({
    tmdbId: 6466,
    title: 'Freddy vs. Jason',
    releaseYear: 2003,
    posterUrl: null,
  });

  const jasonXId = await upsertMovie({
    tmdbId: 11499,
    title: 'Jason X',
    releaseYear: 2001,
    posterUrl: null,
  });

  const minionsGruId = await upsertMovie({
    tmdbId: 438148,
    title: 'Minions: The Rise of Gru',
    releaseYear: 2022,
    posterUrl: null,
  });

  await addReview({
    userId: adminId,
    movieId: fightClubId,
    rating: 4.5,
    body: 'A modern classic.',
  });

  await addReview({
    userId,
    movieId: duneId,
    rating: 5.0,
    body: 'Epic and gorgeous.',
  });

  await addReview({
    userId: jayId,
    movieId: rushHourId,
    rating: 4.0,
    body: 'Classic buddy cop comedy. Great film to watch on the commute home.',
  });

  await addWatchlist({ userId, movieId: fightClubId, status: 'completed' });
  await addWatchlist({ userId, movieId: duneId, status: 'planned' });
  await addWatchlist({ userId: jayId, movieId: jasonBourneId, status: 'planned' });
  await addWatchlist({ userId: jayId, movieId: freddyVsJasonId, status: 'planned' });
  await addWatchlist({ userId: jayId, movieId: minionsGruId, status: 'planned' });
  await addWatchlist({ userId: jayId, movieId: jasonXId, status: 'planned' });

  await pool.query('UPDATE users SET favourite_movie_id = $1 WHERE id = $2', [duneId, userId]);
  await pool.query('UPDATE users SET favourite_movie_id = $1 WHERE id = $2', [jasonXId, jayId]);

  console.log('Seed data inserted.');
}

seed()
  .catch((err) => {
    console.error('Seed failed', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
