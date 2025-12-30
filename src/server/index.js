import app from './app.js';
import { config } from '../config/index.js';

app.listen(config.port, () => {
  console.log(`API listening on port ${config.port}`);
  console.log(`Swagger UI: http://localhost:${config.port}/docs`);
});
