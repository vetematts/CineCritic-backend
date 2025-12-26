import pool from './database.js';

const baseColumns = 'id, username, email, password_hash, role, created_at';

export async function createUser({ username, email, passwordHash, role = 'user' }) {
  const query = `
    INSERT INTO users (username, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING ${baseColumns};
  `;
  const values = [username, email, passwordHash, role];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function getUserById(id) {
  const { rows } = await pool.query(`SELECT ${baseColumns} FROM users WHERE id = $1 LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function getUserByUsername(username) {
  const { rows } = await pool.query(
    `SELECT ${baseColumns} FROM users WHERE username = $1 LIMIT 1`,
    [username]
  );
  return rows[0] || null;
}

export async function getUserByEmail(email) {
  const { rows } = await pool.query(`SELECT ${baseColumns} FROM users WHERE email = $1 LIMIT 1`, [
    email,
  ]);
  return rows[0] || null;
}

export async function listUsers() {
  const { rows } = await pool.query(`SELECT ${baseColumns} FROM users ORDER BY created_at DESC`);
  return rows;
}

export async function updateUser(id, fields) {
  const updates = [];
  const values = [];
  let idx = 1;

  if (fields.username !== undefined) {
    updates.push(`username = $${idx++}`);
    values.push(fields.username);
  }
  if (fields.email !== undefined) {
    updates.push(`email = $${idx++}`);
    values.push(fields.email);
  }
  if (fields.passwordHash !== undefined) {
    updates.push(`password_hash = $${idx++}`);
    values.push(fields.passwordHash);
  }
  if (fields.role !== undefined) {
    updates.push(`role = $${idx++}`);
    values.push(fields.role);
  }

  if (!updates.length) return null;

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING ${baseColumns};`,
    values
  );
  return rows[0] || null;
}

export async function deleteUser(id) {
  const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return rowCount > 0;
}
