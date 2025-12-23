# CineCritic API

Backend-only Express API for fetching TMDB data and serving movie endpoints. Frontend will live in a separate repo.

## Code Style Guide

This project follows the Google JavaScript Style Guide: https://google.github.io/styleguide/jsguide.html

Style is enforced with ESLint (eslint-config-google) and formatting is handled by Prettier. ESLint is configured to defer formatting rules to Prettier to avoid conflicts.

## Dependencies

| Name | Description |
| ---- | ----------- |
| express | HTTP server for the API |
| pg | PostgreSQL client |
| dotenv | Loads environment variables from `.env` |
| helmet | Secures HTTP headers |
| cors | Cross-origin resource sharing middleware |
| express-rate-limit | Basic rate limiting to protect TMDB and the API |
| jest, supertest, pg-mem | Testing stack (unit/integration with in-memory Postgres) |
| eslint, prettier, eslint-config-google | Linting/formatting per Google JS style |


### Commands

- npm run lint # check style + code issues
- npm run lint:fix # auto-fix eslint issues where possible
- npm run format # format with prettier
- npm run dev # run Express with nodemon
- npm run start # run Express directly
- npm test # run Jest tests (uses pg-mem; install deps first)
- npm run seed # seed the database with sample data (dev)

## Environment Variables

Copy `.env.example` to `.env` and set your values:

- `TMDB_API_KEY` (required): your TMDB API key (kept server-side)
- `DATABASE_URL` (required): Postgres connection string
<!-- - `OMDB_API_KEY` (optional): OMDb key if you add extra ratings -->
