import app from './app/app.js';
import { config } from './config/index.js';

app.listen(config.port, () => {
  console.log(`API listening on port ${config.port}`);
});
