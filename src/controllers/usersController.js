import crypto from 'crypto';
import { getContentById, getPosterUrl } from '../services/tmdb.js';
import { upsertMovie, getMovieIdByTmdbId } from '../db/movies.js';
import {
  createUser,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  listUsers,
  updateUser,
  deleteUser,
} from '../db/users.js';
import { signJwt } from '../auth/jwt.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors/http.js';

const roles = ['user', 'admin'];

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, hash] = storedHash.split(':');
  const attempted = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(attempted, 'hex'));
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash: _passwordHash, ...rest } = user;
  return rest;
}

async function ensureMovieId(tmdbId) {
  const existingId = await getMovieIdByTmdbId(Number(tmdbId));
  if (existingId) return existingId;
  const movie = await getContentById(Number(tmdbId), 'movie');
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const saved = await upsertMovie({
    tmdbId: movie.id,
    title: movie.title,
    releaseYear,
    posterUrl: getPosterUrl(movie.poster_path),
    contentType: 'movie',
  });
  return saved.id;
}

export async function listUsersHandler(req, res, next) {
  try {
    const users = await listUsers();
    res.json(users.map(sanitizeUser));
  } catch (err) {
    next(err);
  }
}

export async function createUserHandler(req, res, next) {
  try {
    const { username, email, password, role = 'user' } = req.validated.body;
    if (!roles.includes(role)) {
      throw new BadRequestError('role must be user or admin');
    }
    const passwordHash = hashPassword(password);
    const user = await createUser({ username, email, passwordHash, role });
    res.status(201).json(sanitizeUser(user));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'username or email already exists' });
    }
    next(err);
  }
}

export async function loginHandler(req, res, next) {
  try {
    const { username, email, password } = req.validated.body;
    const user =
      (username && (await getUserByUsername(username))) || (email && (await getUserByEmail(email)));

    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signJwt({ sub: user.id, role: user.role, username: user.username });
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function meHandler(req, res, next) {
  try {
    const user = await getUserById(Number(req.user.sub));
    if (!user) {
      throw new NotFoundError('User not found');
    }
    res.json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
}

export function logoutHandler(req, res) {
  res.json({ message: 'Logged out. Clear the token on the client.' });
}

export async function getUserByIdHandler(req, res, next) {
  try {
    const { id } = req.params;
    const user = await getUserById(Number(id));
    if (!user) {
      throw new NotFoundError('User not found');
    }
    res.json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
}

export async function updateUserHandler(req, res, next) {
  try {
    const { id } = req.validated.params;
    const targetId = Number(id);
    if (req.user.role !== 'admin' && req.user.sub !== targetId) {
      throw new ForbiddenError();
    }
    const { username, email, password, role } = req.validated.body;
    if (role && req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can change roles');
    }

    const updates = {};
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (password !== undefined) updates.passwordHash = hashPassword(password);
    if (req.validated.body.favouriteTmdbId !== undefined) {
      const favId = await ensureMovieId(req.validated.body.favouriteTmdbId);
      updates.favourite_movie_id = favId;
    }

    if (!Object.keys(updates).length) {
      throw new BadRequestError('No fields to update');
    }

    const updated = await updateUser(targetId, updates);
    if (!updated) {
      throw new NotFoundError('User not found');
    }
    res.json(sanitizeUser(updated));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'username or email already exists', code: 'conflict' });
    }
    next(err);
  }
}

export async function deleteUserHandler(req, res, next) {
  try {
    const { id } = req.params;
    const removed = await deleteUser(Number(id));
    if (!removed) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
