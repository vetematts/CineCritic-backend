import { newDb } from 'pg-mem';
import { createTables } from '../src/db/init.js';

describe('database schema', () => {
  test('movies table exists with expected columns and constraints', async () => {
    const mem = newDb();
    const pg = mem.adapters.createPg();
    const pool = new pg.Pool();
    await createTables(pool);

    const client = await pool.connect();
    const columnsResult = await client.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'movies'
       ORDER BY column_name;`
    );

    const columns = columnsResult.rows.map((row) => row.column_name);
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

    const idColumn = columnsResult.rows.find((r) => r.column_name === 'id');
    expect(idColumn.data_type).toBe('integer');

    client.release();
    await pool.end();
  }, 10000);
});
