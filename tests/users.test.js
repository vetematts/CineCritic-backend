import { jest } from '@jest/globals';
import express from 'express';
import { createRequest, createResponse } from './helpers/mockHttp.js';
import { requireAuth } from '../src/middlewares/auth.js';
import { errorHandler } from '../src/middlewares/error.js';
import { verifyJwt, signJwt } from '../src/auth/jwt.js';

const users = [];
let idCounter = 1;

function resetStore() {
  users.length = 0;
  idCounter = 1;
}

// Mock users repo with in-memory store
jest.unstable_mockModule('../src/db/users.js', () => ({
  createUser: async ({ username, email, passwordHash, role }) => {
    const exists = users.some((u) => u.username === username || u.email === email);
    if (exists) {
      const err = new Error('duplicate');
      err.code = '23505';
      throw err;
    }
    const user = {
      id: idCounter++,
      username,
      email,
      password_hash: passwordHash,
      role,
      created_at: new Date().toISOString(),
    };
    users.push(user);
    return user;
  },
  getUserById: async (id) => users.find((u) => u.id === id) ?? null,
  getUserByUsername: async (username) => users.find((u) => u.username === username) ?? null,
  getUserByEmail: async (email) => users.find((u) => u.email === email) ?? null,
  listUsers: async () => [...users],
  updateUser: async (id, fields) => {
    const user = users.find((u) => u.id === id);
    if (!user) return null;
    if (fields.username !== undefined) user.username = fields.username;
    if (fields.email !== undefined) user.email = fields.email;
    if (fields.passwordHash !== undefined) user.password_hash = fields.passwordHash;
    if (fields.role !== undefined) user.role = fields.role;
    return user;
  },
  deleteUser: async (id) => {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    users.splice(idx, 1);
    return true;
  },
}));

process.env.JWT_SECRET = 'test-secret';

const { default: usersRouter } = await import('../src/routes/users.js');

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

describe('users routes', () => {
  beforeEach(() => {
    resetStore();
  });

  const requestRouter = async ({ method, url, body, headers, router = usersRouter }) => {
    const req = createRequest({ method, url, headers });
    req.body = body;
    const res = createResponse();
    await new Promise((resolve) => {
      res.on('end', resolve);
      router.handle(req, res, (err) => {
        if (err) {
          errorHandler(err, req, res, () => resolve());
        } else {
          resolve();
        }
      });
    });
    return res;
  };

  test('creates and lists users without password hash', async () => {
    const res = await requestRouter({
      method: 'POST',
      url: '/',
      body: { username: 'alice', email: 'a@example.com', password: 'secret' },
    });
    expect(res._getStatusCode()).toBe(201);
    const body = res._getJSONData();
    expect(body.username).toBe('alice');
    expect(body.password_hash).toBeUndefined();

    const loginRes = await requestRouter({
      method: 'POST',
      url: '/login',
      body: { username: 'alice', password: 'secret' },
    });
    const token = loginRes._getJSONData().token;

    const listRes = await requestRouter({
      method: 'GET',
      url: '/',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listRes._getStatusCode()).toBe(200);
    const list = listRes._getJSONData();
    expect(list).toHaveLength(1);
    expect(list[0].email).toBe('a@example.com');
    expect(list[0].password_hash).toBeUndefined();
  });

  test('rejects duplicate username/email', async () => {
    await requestRouter({
      method: 'POST',
      url: '/',
      body: { username: 'bob', email: 'b@example.com', password: 'pw' },
    });
    const dup = await requestRouter({
      method: 'POST',
      url: '/',
      body: { username: 'bob', email: 'b@example.com', password: 'pw2' },
    });
    expect(dup._getStatusCode()).toBe(409);
  });

  test('validates required fields and role', async () => {
    const missing = await requestRouter({ method: 'POST', url: '/', body: { username: 'c' } });
    expect(missing._getStatusCode()).toBe(400);

    const badRole = await requestRouter({
      method: 'POST',
      url: '/',
      body: { username: 'd', email: 'd@example.com', password: 'pw', role: 'super' },
    });
    expect(badRole._getStatusCode()).toBe(400);
  });

  test('logs in with username or email', async () => {
    const createRes = await requestRouter({
      method: 'POST',
      url: '/',
      body: { username: 'eve', email: 'e@example.com', password: 'secret' },
    });
    expect(createRes._getStatusCode()).toBe(201);

    const loginUser = await requestRouter({
      method: 'POST',
      url: '/login',
      body: { username: 'eve', password: 'secret' },
    });
    expect(loginUser._getStatusCode()).toBe(200);
    const loginUserBody = loginUser._getJSONData();
    expect(loginUserBody.token).toBeTruthy();
    expect(loginUserBody.user.username).toBe('eve');
    const decoded = verifyJwt(loginUserBody.token);
    expect(decoded?.sub).toBeTruthy();
    expect(decoded?.role).toBe('user');

    const loginEmail = await requestRouter({
      method: 'POST',
      url: '/login',
      body: { email: 'e@example.com', password: 'secret' },
    });
    expect(loginEmail._getStatusCode()).toBe(200);
  });

  test('returns current user via /me and logs out', async () => {
    await requestRouter({
      method: 'POST',
      url: '/',
      body: { username: 'mia', email: 'm@example.com', password: 'secret' },
    });
    const login = await requestRouter({
      method: 'POST',
      url: '/login',
      body: { username: 'mia', password: 'secret' },
    });
    const token = login._getJSONData().token;

    const meRes = await requestRouter({
      method: 'GET',
      url: '/me',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(meRes._getStatusCode()).toBe(200);
    const me = meRes._getJSONData();
    expect(me.username).toBe('mia');
    expect(me.email).toBe('m@example.com');
    expect(me.password_hash).toBeUndefined();

    const logoutRes = await requestRouter({
      method: 'POST',
      url: '/logout',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(logoutRes._getStatusCode()).toBe(200);
    expect(logoutRes._getJSONData().message).toMatch(/logged out/i);
  });

  test('rejects protected routes without token', async () => {
    const res = await requestRouter({ method: 'GET', url: '/' });
    expect(res._getStatusCode()).toBe(401);
  });

  test('requires admin role to delete users', async () => {
    const adminToken = signJwt({ sub: 999, role: 'admin', username: 'admin' });
    const createRes = await requestRouter({
      method: 'POST',
      url: '/',
      body: { username: 'henry', email: 'h@example.com', password: 'secret' },
    });
    const id = createRes._getJSONData().id;

    const loginRes = await requestRouter({
      method: 'POST',
      url: '/login',
      body: { username: 'henry', password: 'secret' },
    });
    const userToken = loginRes._getJSONData().token;

    const forbid = await requestRouter({
      method: 'DELETE',
      url: `/${id}`,
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(forbid._getStatusCode()).toBe(403);

    const allow = await requestRouter({
      method: 'DELETE',
      url: `/${id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(allow._getStatusCode()).toBe(204);
  });

  test('requireAuth attaches user on protected route', async () => {
    const createRes = await requestRouter({
      method: 'POST',
      url: '/',
      body: { username: 'henry', email: 'h@example.com', password: 'secret' },
    });
    const id = createRes._getJSONData().id;
    const loginRes = await requestRouter({
      method: 'POST',
      url: '/login',
      body: { username: 'henry', password: 'secret' },
    });
    const token = loginRes._getJSONData().token;

    // eslint-disable-next-line new-cap
    const protectedRouter = express.Router({ mergeParams: true });
    protectedRouter.get('/protected', requireAuth, (req, res) => {
      res.json({ user: req.user });
    });

    const res = await requestRouter({
      method: 'GET',
      url: '/protected',
      headers: { Authorization: `Bearer ${token}` },
      router: protectedRouter,
    });
    expect(res._getStatusCode()).toBe(200);
    const payload = res._getJSONData().user;
    expect(payload.sub).toBe(id);
    expect(payload.role).toBe('user');
  });

  test('rejects invalid login', async () => {
    await requestRouter({
      method: 'POST',
      url: '/',
      body: { username: 'frank', email: 'f@example.com', password: 'goodpw' },
    });

    const bad = await requestRouter({
      method: 'POST',
      url: '/login',
      body: { username: 'frank', password: 'wrong' },
    });
    expect(bad._getStatusCode()).toBe(401);
  });

  test('gets and deletes a user', async () => {
    const createRes = await requestRouter({
      method: 'POST',
      url: '/',
      body: { username: 'gina', email: 'g@example.com', password: 'secret' },
    });
    const id = createRes._getJSONData().id;

    const getRes = await requestRouter({ method: 'GET', url: `/${id}` });
    expect(getRes._getStatusCode()).toBe(200);
    const user = getRes._getJSONData();
    expect(user.email).toBe('g@example.com');
    expect(user.password_hash).toBeUndefined();

    const adminToken = signJwt({ sub: 1, role: 'admin', username: 'admin' });
    const delRes = await requestRouter({
      method: 'DELETE',
      url: `/${id}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(delRes._getStatusCode()).toBe(204);

    const missing = await requestRouter({ method: 'GET', url: `/${id}` });
    expect(missing._getStatusCode()).toBe(404);
  });

  test('allows self update and forbids other users', async () => {
    const createRes = await requestRouter({
      method: 'POST',
      url: '/',
      body: { username: 'ivy', email: 'i@example.com', password: 'secret' },
    });
    const id = createRes._getJSONData().id;
    const token = signJwt({ sub: id, role: 'user', username: 'ivy' });
    const otherToken = signJwt({ sub: 123, role: 'user', username: 'other' });

    const forbid = await requestRouter({
      method: 'PATCH',
      url: `/${id}`,
      body: { email: 'new@example.com' },
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    expect(forbid._getStatusCode()).toBe(403);

    const allow = await requestRouter({
      method: 'PATCH',
      url: `/${id}`,
      body: { email: 'new@example.com' },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(allow._getStatusCode()).toBe(200);
    expect(allow._getJSONData().email).toBe('new@example.com');

    const adminUpdate = await requestRouter({
      method: 'PATCH',
      url: `/${id}`,
      body: { role: 'admin' },
      headers: { Authorization: `Bearer ${signJwt({ sub: 1, role: 'admin', username: 'admin' })}` },
    });
    expect(adminUpdate._getStatusCode()).toBe(200);
    expect(adminUpdate._getJSONData().role).toBe('admin');
  });
});
