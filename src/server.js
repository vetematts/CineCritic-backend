import app from './index.js';
import { config } from './config/index.js';

app.listen(config.port, () => {
  console.log(`API listening on port ${config.port}`);
  console.log(`Swagger UI: http://localhost:${config.port}/docs`);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
