# CineCritic

CineCritic is a full-stack web application that allows users to browse films and share reviews and ratings.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

### Commands

- npm run lint # check style + code issues
- npm run lint:fix # auto-fix eslint issues where possible
- npm run format # format with prettier

## Environment Variables

Copy `.env.example` to `.env` and set your values:

- `TMDB_API_KEY` (required): your TMDB API key (kept server-side)
- `DATABASE_URL` (required): Postgres connection string
<!-- - `OMDB_API_KEY` (optional): OMDb key if you add extra ratings -->


## How to contribute

The project planning documentation can be found in our Wiki: [(Project Plan: Frontend)](https://github.com/vetematts/CineCritic/wiki/Project-Plan-%E2%80%90-Frontend).