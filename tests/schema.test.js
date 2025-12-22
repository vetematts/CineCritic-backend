import { readFileSync } from 'fs';
import path from 'path';
import { newDb } from 'pg-mem';
import { jest } from '@jest/globals';

const moviesSchemaPath = path.resolve(process.cwd(), 'server/db/schemas/movies.sql');
const moviesSchemaSQL = readFileSync(moviesSchemaPath, 'utf-8');

describe('database schema', () => {
  test('movies table exists with expected columns', async () => {
    const db = newDb();
    const client = db.adapters.createPg().Client;
    const pgClient = new client();
    await pgClient.connect();
    await pgClient.query(moviesSchemaSQL);

    const result = await pgClient.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'movies'
       ORDER BY column_name;`
    );

    const columns = result.rows.map((row) => row.column_name);
    expect(columns).toEqual(
      expect.arrayContaining(['id', 'tmdb_id', 'title', 'release_year', 'poster_url', 'content_type', 'created_at'])
    );

    const idColumn = result.rows.find((r) => r.column_name === 'id');
    expect(idColumn.data_type).toBe('integer');

    const contentTypeCheck = await pgClient.query(
      `SELECT conname
       FROM pg_constraint
       WHERE conrelid = 'movies'::regclass
         AND conname = 'ck_movies_content_type';`
    );
    expect(contentTypeCheck.rowCount).toBe(1);

    await pgClient.end();
  }, 10000);
});
