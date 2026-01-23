import express from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
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

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users (password hashes omitted)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   post:
 *     summary: Create a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 default: user
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       409:
 *         description: Username or email already exists
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', requireAuth, asyncHandler(listUsersHandler));
router.post('/', validate(createUserSchema), asyncHandler(createUserHandler));

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login with username or email (returns JWT)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login success returns JWT token and user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token (HS256)
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/login', validate(loginSchema), asyncHandler(loginHandler));

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get the current authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user (password hash omitted)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/me', requireAuth, asyncHandler(meHandler));

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Logout (client should clear stored token)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout acknowledgement (stateless; client clears token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Logged out'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/logout', requireAuth, asyncHandler(logoutHandler));

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   patch:
 *     summary: Update a user (self or admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               favouriteTmdbId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Duplicate username or email
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: User deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', asyncHandler(getUserByIdHandler));
router.patch('/:id', requireAuth, validate(patchUserSchema), asyncHandler(updateUserHandler));
router.delete('/:id', requireAuth, requireRole('admin'), asyncHandler(deleteUserHandler));

export default router;
