import crypto from 'crypto';
import { getContentById, getPosterUrl } from '../services/tmdb.js';
import { upsertMovie, getMovieIdByTmdbId } from '../models/movies.js';
import {
  createUser,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  listUsers,
  updateUser,
  deleteUser,
} from '../models/users.js';
import { signJwt } from '../middlewares/jwt.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorisedError,
  ConflictError,
} from '../errors/http.js';

const roles = ['user', 'admin'];

function hashPassword(password) {
  // Add a random string before hashing so identical passwords don't match.
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  // Compare without leaking timing clues.
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, hash] = storedHash.split(':');
  const attempted = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(attempted, 'hex'));
}

function sanitizeUser(user) {
  // Never return password hashes to users.
  if (!user) return null;
  const { password_hash: _passwordHash, ...rest } = user;
  return rest;
}

async function ensureMovieId(tmdbId) {
  // Cache the favourite TMDB movie locally so a FK can be stored.
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

export async function listUsersHandler(req, res) {
  const users = await listUsers();
  res.json(users.map(sanitizeUser));
}

export async function createUserHandler(req, res) {
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
      throw new ConflictError('username or email already exists');
    }
    throw err;
  }
}

export async function loginHandler(req, res) {
  const { username, email, password } = req.validated.body;
  const user =
    (username && (await getUserByUsername(username))) || (email && (await getUserByEmail(email)));

  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new UnauthorisedError('Invalid credentials');
  }

  const token = signJwt({ sub: user.id, role: user.role, username: user.username });
  res.json({ token, user: sanitizeUser(user) });
}

export async function meHandler(req, res) {
  const user = await getUserById(Number(req.user.sub));
  if (!user) {
    throw new NotFoundError('User not found');
  }
  res.json(sanitizeUser(user));
}

export function logoutHandler(req, res) {
  res.json({ message: 'Logged out. Clear the token on the client.' });
}

export async function getUserByIdHandler(req, res) {
  const { id } = req.params;
  const user = await getUserById(Number(id));
  if (!user) {
    throw new NotFoundError('User not found');
  }
  res.json(sanitizeUser(user));
}

export async function updateUserHandler(req, res) {
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
      throw new ConflictError('username or email already exists');
    }
    throw err;
  }
}

export async function deleteUserHandler(req, res) {
  const { id } = req.params;
  const removed = await deleteUser(Number(id));
  if (!removed) {
    throw new NotFoundError('User not found');
  }
  res.status(204).send();
}
