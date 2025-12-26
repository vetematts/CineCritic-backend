import express from 'express';
import crypto from 'crypto';
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
import { requireAuth, requireRole } from '../middlewares/auth.js';

// eslint-disable-next-line new-cap
const router = express.Router();
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

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const users = await listUsers();
    res.json(users.map(sanitizeUser));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { username, email, password, role = 'user' } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required' });
    }
    if (!roles.includes(role)) {
      return res.status(400).json({ error: 'role must be user or admin' });
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
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    if ((!username && !email) || !password) {
      return res
        .status(400)
        .json({ error: 'username or email plus password are required to login' });
    }

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
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await getUserById(Number(id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const targetId = Number(id);
    if (req.user.role !== 'admin' && req.user.sub !== targetId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { username, email, password, role } = req.body || {};
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can change roles' });
    }

    const updates = {};
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (password !== undefined) updates.passwordHash = hashPassword(password);

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const updated = await updateUser(targetId, updates);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(sanitizeUser(updated));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'username or email already exists' });
    }
    next(err);
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
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
});

export default router;
