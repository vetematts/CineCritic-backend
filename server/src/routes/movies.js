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
    const results = await getTrending('movie');
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/top-rated', async (req, res, next) => {
  try {
    const results = await getTopRated('movie');
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/genres', async (req, res, next) => {
  try {
    const genres = await getCachedGenres('movie');
    res.json(genres);
  } catch (err) {
    next(err);
  }
});

router.get('/year/:year', async (req, res, next) => {
  try {
    const { year } = req.params;
    const { sortBy = 'popularity.desc', limit = 20 } = req.query;
    const results = await getContentByYear(Number(year), 'movie', sortBy, Number(limit));
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/genre/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sortBy = 'popularity.desc', page = 1 } = req.query;
    const results = await getContentByGenre(Number(id), 'movie', sortBy, Number(page));
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const { q = '', page = 1 } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    const results = await searchContent(q, 'movie', Number(page));
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await getContentById(Number(id), 'movie');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
