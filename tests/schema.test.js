import { newDb } from 'pg-mem';
import { createTables } from '../server/src/db/init.js';

describe('database schema', () => {
  test('movies table exists with expected columns', async () => {
    const db = newDb();
    const pg = db.adapters.createPg();
    const testDb = new pg.Pool();
    await createTables(testDb);

    const pgClient = await testDb.connect();
    const result = await pgClient.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'movies'
       ORDER BY column_name;`
    );

    const columns = result.rows.map((row) => row.column_name);
    expect(columns).toEqual(
      expect.arrayContaining([
        'id',
        'tmdb_id',
        'title',
        'release_year',
        'poster_url',
        'content_type',
        'created_at',
      ])
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

    const statusResult = await testDb.query(
      "SELECT conname FROM pg_constraint WHERE conname = 'ck_movies_content_type'"
    );
    expect(statusResult.rowCount).toBe(1);

    await testDb.end();
  }, 10000);
});
