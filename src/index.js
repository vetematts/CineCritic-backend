import app from './app/app.js';

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
