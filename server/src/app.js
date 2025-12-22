import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import moviesRouter from './routes/movies.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

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

app.use('/api/movies', moviesRouter);

// General error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});

export default app;
