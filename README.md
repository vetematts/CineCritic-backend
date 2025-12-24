# CineCritic API

Backend-only Express API for fetching TMDB data and serving movie endpoints. Frontend will live in a separate repo.

## Code Style Guide

This project follows the Google JavaScript Style Guide: https://google.github.io/styleguide/jsguide.html

Style is enforced with ESLint (eslint-config-google) and formatting is handled by Prettier. ESLint is configured to defer formatting rules to Prettier to avoid conflicts.

## Dependencies

| Name                                                                                                                                                                           | Description                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| [express](https://www.npmjs.com/package/express)                                                                                                                               | HTTP server and routing                         |
| [pg](https://www.npmjs.com/package/pg)                                                                                                                                         | PostgreSQL client                               |
| [dotenv](https://www.npmjs.com/package/dotenv)                                                                                                                                 | Environment variable loading                    |
| [helmet](https://www.npmjs.com/package/helmet)                                                                                                                                 | Security headers                                |
| [cors](https://www.npmjs.com/package/cors)                                                                                                                                     | Cross-origin resource sharing                   |
| [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)                                                                                                         | Basic rate limiting (protect TMDB proxy)        |
| [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)                                                                                                                     | JWT signing/verification for auth               |
| [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express), [yamljs](https://www.npmjs.com/package/yamljs)                                                         | Serve Swagger docs from openapi.yaml            |
| [jest](https://www.npmjs.com/package/jest), [supertest](https://www.npmjs.com/package/supertest), [pg-mem](https://www.npmjs.com/package/pg-mem)                               | Testing (unit, integration, in-memory Postgres) |
| [eslint](https://www.npmjs.com/package/eslint), [prettier](https://www.npmjs.com/package/prettier), [eslint-config-google](https://www.npmjs.com/package/eslint-config-google) | Code style and formatting                       |

### Commands

- `npm run lint` # check style + code issues
- `npm run lint:fix` # auto-fix eslint issues where possible
- `npm run format` # format with prettier
- `npm run dev` # run Express with nodemon
- `npm run start` # run Express directly
- `npm test` # run Jest tests (uses pg-mem; install deps first)
- `npm run seed` # seed the database with sample data (dev)

Docs available at `http://localhost:4000/docs` once the server is running.

## Key Endpoints

- GET /health – service check
- Swagger UI: /docs (served from docs/openapi.yaml)
- Movies: GET /api/movies/trending, /top-rated, /genres, /search?q=, /year/{year}, /genre/{id}, /{id}
- Reviews: GET /api/reviews/{tmdbId}, POST /api/reviews, PUT /api/reviews/{id}, DELETE /api/reviews/{id}
- Watchlist: GET /api/watchlist/{userId}, POST /api/watchlist, PUT /api/watchlist/{id}, DELETE /api/watchlist/{id}
- Users: GET /api/users, POST /api/users, POST /api/users/login, GET /api/users/{id}, DELETE /api/users/{id}
  - Auth required for GET /api/users and DELETE /api/users/{id}; other mutating routes (reviews POST/PUT/DELETE, watchlist GET/POST/PUT/DELETE) also require Bearer JWT.

## Environment Variables

Copy `.env.example` to `.env` and set your values:

- `TMDB_API_KEY` (required): your TMDB API key (kept server-side)
- `DATABASE_URL` (required): Postgres connection string
- `JWT_SECRET` (required for auth): secret key for signing JWTs
<!-- - `OMDB_API_KEY` (optional): OMDb key if you add extra ratings -->

## Authentication

- Login via `POST /api/users/login` to receive a JWT (`token`); default expiry 1 hour.
- Send the token on protected routes using `Authorization: Bearer <token>`.
- Protected today: `GET /api/users` and `DELETE /api/users/{id}` (others are public).
  - Also protected: reviews POST/PUT/DELETE and watchlist GET/POST/PUT/DELETE.
