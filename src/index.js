import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
import moviesRouter from './routes/movies.js';
import reviewsRouter from './routes/reviews.js';
import watchlistRouter from './routes/watchlist.js';
import favouritesRouter from './routes/favourites.js';
import usersRouter from './routes/users.js';
import { errorHandler } from './middlewares/error.js';
import { notFound } from './middlewares/notFound.js';
import { requestLogger } from './middlewares/logger.js';
import pool from './models/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDoc = YAML.load(path.join(__dirname, '..', 'docs', 'openapi.yaml'));

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging middleware (should be early in the stack to log all requests)
app.use(requestLogger);

// Limit how many requests one IP can make in a short time to protect TMDB and the server.
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 60, // limit each IP to 60 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
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

// Database health check endpoint
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
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.use(notFound);
app.use(errorHandler);

export default app;
