import dotenv from 'dotenv';

dotenv.config();

const required = ['DATABASE_URL', 'JWT_SECRET', 'TMDB_API_KEY'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.warn(`Warning: Missing required env vars: ${missing.join(', ')}`);
}

export const config = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  tmdbApiKey: process.env.TMDB_API_KEY,
};
