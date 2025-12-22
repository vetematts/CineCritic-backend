import { Router } from 'express';
import {
  getTrending,
  getTopRated,
  getContentByYear,
  getContentByGenre,
  getContentById,
  getCachedGenres,
  searchContent,
} from '../tmdb.js';

const router = Router();

router.get('/trending', async (req, res, next) => {
  try {
    const { type = 'movie' } = req.query;
    const results = await getTrending(type);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/top-rated', async (req, res, next) => {
  try {
    const { type = 'movie' } = req.query;
    const results = await getTopRated(type);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/genres', async (req, res, next) => {
  try {
    const { type = 'movie' } = req.query;
    const genres = await getCachedGenres(type);
    res.json(genres);
  } catch (err) {
    next(err);
  }
});

router.get('/year/:year', async (req, res, next) => {
  try {
    const { year } = req.params;
    const { type = 'movie', sortBy = 'popularity.desc', limit = 20 } = req.query;
    const results = await getContentByYear(Number(year), type, sortBy, Number(limit));
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/genre/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type = 'movie', sortBy = 'popularity.desc', page = 1 } = req.query;
    const results = await getContentByGenre(Number(id), type, sortBy, Number(page));
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const { q = '', type = 'movie', page = 1 } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    const results = await searchContent(q, type, Number(page));
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type = 'movie' } = req.query;
    const result = await getContentById(Number(id), type);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
