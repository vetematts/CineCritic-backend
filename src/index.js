import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import moviesRouter from './routes/movies.js';
import reviewsRouter from './routes/reviews.js';
import watchlistRouter from './routes/watchlist.js';
import favouritesRouter from './routes/favourites.js';
import usersRouter from './routes/users.js';
import publicRouter from './routes/public.js';
import { errorHandler } from './middlewares/error.js';
import { notFound } from './middlewares/notFound.js';
import { requestLogger } from './middlewares/logger.js';
import pool from './models/database.js';
import { swaggerOptions } from './config/swagger.js';

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);
app.use(express.json());

// Request logging middleware (should be early in the stack to log all requests)
app.use(requestLogger);

// Limit how many requests one IP can make in a short time to protect TMDB and the server.
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 60, // limit each IP to 60 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
});

app.use('/api', apiLimiter);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns a simple status check without database verification
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'ok'
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.json({
    message: 'CineCritic API',
    docs: '/docs',
    health: '/health',
  });
});

/**
 * @swagger
 * /api/health/database:
 *   get:
 *     summary: Database health check
 *     description: Verifies database connectivity and returns connection status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database is connected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'ok'
 *                 database:
 *                   type: string
 *                   example: 'connected'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: '2024-01-15T10:30:00.000Z'
 *                 version:
 *                   type: string
 *                   example: 'PostgreSQL 15.0'
 *       503:
 *         description: Database is disconnected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'error'
 *                 database:
 *                   type: string
 *                   example: 'disconnected'
 *                 error:
 *                   type: string
 *                   example: 'Connection timeout'
 */
app.get('/api/health/database', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as timestamp, version() as version');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].timestamp,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: err.message,
    });
  }
});

app.use('/api/movies', moviesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/favourites', favouritesRouter);
app.use('/api/users', usersRouter);
app.use('/api/public', publicRouter);

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(swaggerSpec);
});

const swaggerUiOptions = {
  customSiteTitle: 'CineCritic API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
  },
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

app.use(notFound);
app.use(errorHandler);

export default app;
