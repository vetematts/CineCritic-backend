import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const required = ['DATABASE_URL', 'JWT_SECRET', 'TMDB_API_KEY'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error('ERROR: Missing required environment variables:');
  missing.forEach((key) => {
    console.error(`  - ${key}`);
  });
  console.error('\nPlease set these variables in your .env file or environment.');
  process.exit(1);
}

// Validate DATABASE_URL format (should start with postgres:// or postgresql://)
if (process.env.DATABASE_URL && !/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL)) {
  console.error('ERROR: DATABASE_URL must be a valid PostgreSQL connection string.');
  console.error('Expected format: postgres://user:password@host:port/database');
  process.exit(1);
}

// Validate PORT is a number if provided
if (process.env.PORT && isNaN(Number(process.env.PORT))) {
  console.error('ERROR: PORT must be a valid number.');
  process.exit(1);
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  tmdbApiKey: process.env.TMDB_API_KEY,
};
