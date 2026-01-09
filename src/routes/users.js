import express from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { z } from 'zod';
import {
  listUsersHandler,
  createUserHandler,
  loginHandler,
  meHandler,
  logoutHandler,
  getUserByIdHandler,
  updateUserHandler,
  deleteUserHandler,
} from '../controllers/usersController.js';

// eslint-disable-next-line new-cap
const router = express.Router();

const createUserSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'username is required'),
    email: z.string().email('email must be valid'),
    password: z.string().min(1, 'password is required'),
    role: z.enum(['user', 'admin']).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(1, 'password is required'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const patchUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'id must be a number'),
  }),
  body: z
    .object({
      username: z.string().min(1).optional(),
      email: z.string().email().optional(),
      password: z.string().min(1).optional(),
      role: z.enum(['user', 'admin']).optional(),
      favouriteTmdbId: z.number().int().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, 'No fields to update'),
  query: z.object({}).optional(),
});

router.get('/', requireAuth, listUsersHandler);
router.post('/', validate(createUserSchema), createUserHandler);
router.post('/login', validate(loginSchema), loginHandler);
router.get('/me', requireAuth, meHandler);
router.post('/logout', requireAuth, logoutHandler);
router.get('/:id', getUserByIdHandler);
router.patch('/:id', requireAuth, validate(patchUserSchema), updateUserHandler);
router.delete('/:id', requireAuth, requireRole('admin'), deleteUserHandler);

export default router;
