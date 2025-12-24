import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const users = [];
let idCounter = 1;

function resetStore() {
  users.length = 0;
  idCounter = 1;
}

// Mock users repo with in-memory store
jest.unstable_mockModule('../server/src/db/users.js', () => ({
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
  deleteUser: async (id) => {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    users.splice(idx, 1);
    return true;
  },
}));

const { default: usersRouter } = await import('../server/src/routes/users.js');

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

let server;
let agent;

describe('users routes', () => {
  beforeAll(() => {
    server = app.listen(0, '127.0.0.1');
    agent = request.agent(server);
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  beforeEach(() => {
    resetStore();
  });

  test('creates and lists users without password hash', async () => {
    const res = await agent
      .post('/api/users')
      .send({ username: 'alice', email: 'a@example.com', password: 'secret' });
    expect(res.status).toBe(201);
    expect(res.body.username).toBe('alice');
    expect(res.body.password_hash).toBeUndefined();

    const listRes = await agent.get('/api/users');
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].email).toBe('a@example.com');
    expect(listRes.body[0].password_hash).toBeUndefined();
  });

  test('rejects duplicate username/email', async () => {
    await agent
      .post('/api/users')
      .send({ username: 'bob', email: 'b@example.com', password: 'pw' });
    const dup = await agent
      .post('/api/users')
      .send({ username: 'bob', email: 'b@example.com', password: 'pw2' });
    expect(dup.status).toBe(409);
  });

  test('validates required fields and role', async () => {
    const missing = await agent.post('/api/users').send({ username: 'c' });
    expect(missing.status).toBe(400);

    const badRole = await agent
      .post('/api/users')
      .send({ username: 'd', email: 'd@example.com', password: 'pw', role: 'super' });
    expect(badRole.status).toBe(400);
  });

  test('logs in with username or email', async () => {
    const createRes = await agent
      .post('/api/users')
      .send({ username: 'eve', email: 'e@example.com', password: 'secret' });
    expect(createRes.status).toBe(201);

    const loginUser = await agent
      .post('/api/users/login')
      .send({ username: 'eve', password: 'secret' });
    expect(loginUser.status).toBe(200);
    expect(loginUser.body.token).toBeTruthy();
    expect(loginUser.body.user.username).toBe('eve');

    const loginEmail = await agent
      .post('/api/users/login')
      .send({ email: 'e@example.com', password: 'secret' });
    expect(loginEmail.status).toBe(200);
  });

  test('rejects invalid login', async () => {
    await agent
      .post('/api/users')
      .send({ username: 'frank', email: 'f@example.com', password: 'goodpw' });

    const bad = await agent
      .post('/api/users/login')
      .send({ username: 'frank', password: 'wrong' });
    expect(bad.status).toBe(401);
  });

  test('gets and deletes a user', async () => {
    const createRes = await agent
      .post('/api/users')
      .send({ username: 'gina', email: 'g@example.com', password: 'secret' });
    const id = createRes.body.id;

    const getRes = await agent.get(`/api/users/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.email).toBe('g@example.com');
    expect(getRes.body.password_hash).toBeUndefined();

    const delRes = await agent.delete(`/api/users/${id}`);
    expect(delRes.status).toBe(204);

    const missing = await agent.get(`/api/users/${id}`);
    expect(missing.status).toBe(404);
  });
});
