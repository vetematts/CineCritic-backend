# 🎞️ CineCritic API

Backend-only Express API for fetching TMDB data and serving movie endpoints. Frontend will live in a separate repo.

## 📂 Repositories

- Backend: https://github.com/vetematts/CineCritic-backend.git
- Frontend: https://github.com/vetematts/CineCritic-frontend.git
- Live API Docs (GitHub Pages): https://vetematts.github.io/CineCritic-backend/
- Local Swagger UI: http://localhost:4000/docs (alias: http://localhost:4000/api-docs)

## 🚀 Deployed URLs

- Backend API: (to be added)
- Frontend App: (to be added)

## 📏 Code Style Guide

This project follows the Google JavaScript Style Guide: https://google.github.io/styleguide/jsguide.html

Style is enforced with ESLint (eslint-config-google) and formatting is handled by Prettier. ESLint is configured to defer formatting rules to Prettier to avoid conflicts.

## 📦 Dependencies

| Name                                                                                                                                                                           | Description                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| [express](https://www.npmjs.com/package/express)                                                                                                                               | HTTP server and routing                                    |
| [pg](https://www.npmjs.com/package/pg)                                                                                                                                         | PostgreSQL client                                          |
| [dotenv](https://www.npmjs.com/package/dotenv)                                                                                                                                 | Environment variable loading                               |
| [helmet](https://www.npmjs.com/package/helmet)                                                                                                                                 | Security headers                                           |
| [cors](https://www.npmjs.com/package/cors)                                                                                                                                     | Cross-origin resource sharing                              |
| [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)                                                                                                         | Basic rate limiting (protect TMDB proxy)                   |
| [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)                                                                                                                     | JWT signing/verification for auth                          |
| [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express), [yamljs](https://www.npmjs.com/package/yamljs)                                                         | Serve Swagger docs from openapi.yaml                       |
| [zod](https://www.npmjs.com/package/zod)                                                                                                                                       | Request schema validation for routes                       |
| [jest](https://www.npmjs.com/package/jest), [supertest](https://www.npmjs.com/package/supertest), [pg-mem](https://www.npmjs.com/package/pg-mem)                               | Testing (unit, integration, pg-mem for in-memory Postgres) |
| [eslint](https://www.npmjs.com/package/eslint), [prettier](https://www.npmjs.com/package/prettier), [eslint-config-google](https://www.npmjs.com/package/eslint-config-google) | Code style and formatting                                  |

## 💻 Hardware Requirements

- CPU: modern dual-core (or better)
- RAM: 4 GB minimum (8 GB recommended for running Postgres + API + frontend)
- Disk: ~500 MB for node_modules plus database storage

## 🧭 Technology Choices and Alternatives

### Core Framework & Database

**Express.js + Node.js**

- **Purpose:** Web framework for building RESTful APIs
- **Why Chosen:** Fast development iteration, extensive middleware ecosystem, large community support, excellent documentation
- **Alternatives:** Fastify (faster performance, stricter typing), Koa (modern async/await patterns), NestJS (TypeScript-first with dependency injection)

**PostgreSQL via `pg` (node-postgres)**

- **Purpose:** Relational database for storing users, movies, reviews, watchlist with ACID compliance
- **Why Chosen:** Relational structure suits user-reviews-watchlist relationships, strong data integrity with foreign keys, excellent query support
- **Alternatives:** MongoDB (document-based, flexible schemas), MySQL (similar but fewer advanced features), SQLite (file-based, not suitable for production)

### Authentication & Validation

**JWT (jsonwebtoken)**

- **Purpose:** Stateless authentication using JSON Web Tokens
- **Why Chosen:** Stateless authentication scales well (no session storage needed), simple to implement, industry-standard approach
- **Alternatives:** Server-side sessions with cookies (more secure, can revoke sessions), OAuth 2.0 (better for third-party auth but more complex)

**Zod**

- **Purpose:** Runtime schema validation for request bodies, query parameters, and URL parameters
- **Why Chosen:** Modern API with clear error messages, reusable schemas, excellent developer experience, strong type inference
- **Alternatives:** express-validator (Express-specific, middleware-oriented), Joi (mature validation library), Yup (similar to Zod but less popular)

## 📜 Licensing Notes

The project depends on open-source packages under permissive licenses (MIT/ISC/BSD-2/3). See each dependency's npm page for details.

### Commands

- `npm run lint` # check style + code issues
- `npm run lint:fix` # auto-fix eslint issues where possible
- `npm run format` # format with prettier
- `npm run dev` # run Express with nodemon (entrypoint: src/server.js)
- `npm run start` # run Express directly (entrypoint: src/server.js)
- `npm test` # run Jest tests (uses pg-mem; install deps first)
- `npm run seed` # seed the database with sample data (dev)
  - Seeds admin (`admin@example.com` / `adminpass`) and demo (`demo@example.com` / `demopass`) users, two movies, reviews, and watchlist entries. Idempotent; run against the DB in `DATABASE_URL`.
  - To reseed: ensure `DATABASE_URL` points at your Postgres, then rerun `npm run seed` (safe to run multiple times).

Docs available at `http://localhost:4000/docs` once the server is running.

## 🛠️ Backend Install Instructions

1. **Clone the repo**
   ```bash
   git clone https://github.com/vetematts/CineCritic-backend.git
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Create `.env`**
   ```sh
   TMDB_API_KEY="YOUR_TMDB_KEY"
   DATABASE_URL="postgres://<user>:<password>@localhost:5432/CineCritic"
   JWT_SECRET="YOUR_JWT_SECRET"
   ```
4. **Local Postgres setup (if needed)**
   ```sh
   createdb CineCritic
   ```
   If `createdb` is not available, open `psql` and run:
   ```sql
   CREATE DATABASE "CineCritic";
   ```
5. **Seed the database**
   ```bash
   npm run seed
   ```
6. **Start the API**
   ```bash
   npm run dev
   ```
7. **Login details (seeded users)**
   ```txt
   admin@example.com / adminpass
   demo@example.com / demopass
   jay.son@payload.dev / json123
   ```

## 🧩 Key Endpoints

- GET /health – service check
- GET /api/health/database – database connectivity check
- Swagger UI: /docs (served from docs/openapi.yaml)
- Movies: GET /api/movies/trending, /top-rated, /genres, /search?q=, /advanced (title/year/genres/crew/rating), /year/{year}, /genre/{id}, /{id}
- Reviews: GET /api/reviews/{tmdbId}, POST /api/reviews, PUT /api/reviews/{id}, DELETE /api/reviews/{id}
- Watchlist: GET /api/watchlist/{userId}, POST /api/watchlist, PUT /api/watchlist/{id}, DELETE /api/watchlist/{id}
- Favourites: GET /api/favourites/{userId}, POST /api/favourites, DELETE /api/favourites/{userId}/{tmdbId}
- Users: GET /api/users, POST /api/users, POST /api/users/login, GET /api/users/me, POST /api/users/logout, GET /api/users/{id}, PATCH /api/users/{id}, DELETE /api/users/{id}
  - Auth required for GET /api/users, GET /api/users/me, POST /api/users/logout, PATCH /api/users/{id}, and DELETE /api/users/{id}; other mutating routes (reviews POST/PUT/DELETE, watchlist GET/POST/PUT/DELETE) also require Bearer JWT.
  - Role rules: only admins can delete users or change roles; reviews and watchlist mutations require the owner or an admin.
  - PATCH supports updating username/email/password/role (admin only) and `favouriteTmdbId` (sets favourite movie by TMDB id).

## 🧪 Endpoints

### Authentication

| Operation | URL                | Method | Body                                           | Access |
| --------- | ------------------ | ------ | ---------------------------------------------- | ------ |
| Login     | `/api/users/login` | POST   | `{"username": "demo", "password": "demopass"}` | Public |

### Movies (TMDB Proxy)

Note: `/api/movies/{id}` caches the movie and its genres into Postgres (`movies`, `genres`, `movie_genres`).

| Operation       | URL                                                                     | Method | Body | Access |
| --------------- | ----------------------------------------------------------------------- | ------ | ---- | ------ |
| Trending        | `/api/movies/trending`                                                  | GET    | -    | Public |
| Top Rated       | `/api/movies/top-rated`                                                 | GET    | -    | Public |
| Genres          | `/api/movies/genres`                                                    | GET    | -    | Public |
| Search          | `/api/movies/search?q=QUERY`                                            | GET    | -    | Public |
| Advanced Search | `/api/movies/advanced?query=&year=&genres=&crew=&ratingMin=&ratingMax=` | GET    | -    | Public |
| By Year         | `/api/movies/year/{year}`                                               | GET    | -    | Public |
| By Genre        | `/api/movies/genre/{id}`                                                | GET    | -    | Public |
| By TMDB Id      | `/api/movies/{id}`                                                      | GET    | -    | Public |

### Reviews

| Operation            | URL                     | Method | Body                                          | Access              |
| -------------------- | ----------------------- | ------ | --------------------------------------------- | ------------------- |
| Create Review        | `/api/reviews`          | POST   | `{"tmdbId": 550, "userId": 2, "rating": 4.5}` | Auth (author/admin) |
| List Reviews (movie) | `/api/reviews/{tmdbId}` | GET    | -                                             | Public              |
| Get Review By Id     | `/api/reviews/id/{id}`  | GET    | -                                             | Public              |
| Update Review        | `/api/reviews/{id}`     | PUT    | `{"body": "Updated", "rating": 4}`            | Auth (author/admin) |
| Delete Review        | `/api/reviews/{id}`     | DELETE | -                                             | Auth (author/admin) |

### Watchlist

| Operation        | URL                       | Method | Body                                                | Access            |
| ---------------- | ------------------------- | ------ | --------------------------------------------------- | ----------------- |
| Get Watchlist    | `/api/watchlist/{userId}` | GET    | -                                                   | Auth (self/admin) |
| Add to Watchlist | `/api/watchlist`          | POST   | `{"tmdbId": 550, "userId": 2, "status": "planned"}` | Auth (self/admin) |
| Update Watchlist | `/api/watchlist/{id}`     | PUT    | `{"status": "completed"}`                           | Auth (self/admin) |
| Delete Watchlist | `/api/watchlist/{id}`     | DELETE | -                                                   | Auth (self/admin) |

### Favourites

| Operation              | URL                                 | Method | Body                           | Access            |
| ---------------------- | ----------------------------------- | ------ | ------------------------------ | ----------------- |
| Get Favourites         | `/api/favourites/{userId}`          | GET    | -                              | Auth (self/admin) |
| Add to Favourites      | `/api/favourites`                   | POST   | `{"tmdbId": 550, "userId": 2}` | Auth (self/admin) |
| Delete from Favourites | `/api/favourites/{userId}/{tmdbId}` | DELETE | -                              | Auth (self/admin) |

### Users

| Operation   | URL                 | Method | Body                                                                    | Access            |
| ----------- | ------------------- | ------ | ----------------------------------------------------------------------- | ----------------- |
| Create User | `/api/users`        | POST   | `{"username": "alice", "email": "a@example.com", "password": "secret"}` | Public            |
| List Users  | `/api/users`        | GET    | -                                                                       | Auth              |
| Get User    | `/api/users/{id}`   | GET    | -                                                                       | Public            |
| Get Me      | `/api/users/me`     | GET    | -                                                                       | Auth              |
| Logout      | `/api/users/logout` | POST   | -                                                                       | Auth              |
| Update User | `/api/users/{id}`   | PATCH  | `{"email": "new@example.com"}`                                          | Auth (self/admin) |
| Delete User | `/api/users/{id}`   | DELETE | -                                                                       | Auth (admin only) |

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and set your values:

- `TMDB_API_KEY` (required): your TMDB API key (kept server-side)
- `DATABASE_URL` (required): Postgres connection string
- `JWT_SECRET` (required for auth): secret key for signing JWTs
<!-- - `OMDB_API_KEY` (optional): OMDb key if you add extra ratings -->

## 🔐 Authentication

- Login via `POST /api/users/login` to receive a JWT (`token`); default expiry 1 hour.
- Send the token on protected routes using `Authorization: Bearer <token>`.
- Protected routes: `GET /api/users`, `GET /api/users/me`, `POST /api/users/logout`, `PATCH /api/users/{id}`, `DELETE /api/users/{id}`, reviews POST/PUT/DELETE, and watchlist GET/POST/PUT/DELETE.
- Logout is stateless: `POST /api/users/logout` simply acknowledges; clients must clear their stored token.
