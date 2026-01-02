const { getPool } = require('../lib/postgres');
const logger = require('../utils/logger');

class PointsError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const ensureSchema = async () => {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS points_users (
      user_id VARCHAR(64) PRIMARY KEY,
      email TEXT,
      username TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS points_transactions (
      id BIGSERIAL PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES points_users(user_id) ON DELETE CASCADE,
      points INTEGER NOT NULL CHECK (points > 0),
      direction VARCHAR(10) NOT NULL CHECK (direction IN ('earn', 'redeem')),
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_points_transactions_user_created
      ON points_transactions (user_id, created_at DESC);
  `);
};

const upsertUser = async (client, { userId, email, username }) => {
  await client.query(
    `INSERT INTO points_users (user_id, email, username)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE
     SET email = COALESCE(EXCLUDED.email, points_users.email),
         username = COALESCE(EXCLUDED.username, points_users.username),
         updated_at = NOW()`,
    [userId, email || null, username || null]
  );
};

const getBalance = async (client, userId) => {
  const { rows } = await client.query(
    `SELECT COALESCE(SUM(CASE WHEN direction = 'earn' THEN points ELSE -points END), 0) AS balance
     FROM points_transactions
     WHERE user_id = $1`,
    [userId]
  );
  return parseInt(rows[0].balance, 10) || 0;
};

const earnPoints = async ({ userId, email, username, points, metadata }) => {
  if (!Number.isInteger(points) || points <= 0) {
    throw new PointsError('Points must be a positive integer', 'POINTS_INVALID', 400);
  }

  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    await upsertUser(client, { userId, email, username });
    await client.query('SELECT user_id FROM points_users WHERE user_id = $1 FOR UPDATE', [userId]);

    const { rows: txRows } = await client.query(
      `INSERT INTO points_transactions (user_id, points, direction, metadata)
       VALUES ($1, $2, 'earn', $3)
       RETURNING id, user_id, points, direction, metadata, created_at`,
      [userId, points, metadata || null]
    );

    const balance = await getBalance(client, userId);

    await client.query('COMMIT');

    return {
      balance,
      transaction: txRows[0]
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Earn points failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

const redeemPoints = async ({ userId, email, username, points, metadata }) => {
  if (!Number.isInteger(points) || points <= 0) {
    throw new PointsError('Points must be a positive integer', 'POINTS_INVALID', 400);
  }

  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    await upsertUser(client, { userId, email, username });
    await client.query('SELECT user_id FROM points_users WHERE user_id = $1 FOR UPDATE', [userId]);

    const currentBalance = await getBalance(client, userId);

    if (currentBalance < points) {
      throw new PointsError('Insufficient balance', 'INSUFFICIENT_BALANCE', 400);
    }

    const { rows: txRows } = await client.query(
      `INSERT INTO points_transactions (user_id, points, direction, metadata)
       VALUES ($1, $2, 'redeem', $3)
       RETURNING id, user_id, points, direction, metadata, created_at`,
      [userId, points, metadata || null]
    );

    const balance = await getBalance(client, userId);

    await client.query('COMMIT');

    return {
      balance,
      transaction: txRows[0]
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Redeem points failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

const getLeaderboard = async ({ limit = 10, offset = 0 }) => {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

  const { rows } = await getPool().query(
    `SELECT u.user_id, u.email, u.username,
            COALESCE(SUM(CASE WHEN t.direction = 'earn' THEN t.points ELSE -t.points END), 0) AS balance
     FROM points_users u
     LEFT JOIN points_transactions t ON t.user_id = u.user_id
     GROUP BY u.user_id, u.email, u.username
     ORDER BY balance DESC, u.user_id ASC
     LIMIT $1 OFFSET $2`,
    [safeLimit, safeOffset]
  );

  return rows.map(row => ({
    userId: row.user_id,
    email: row.email,
    username: row.username,
    balance: parseInt(row.balance, 10) || 0
  }));
};

module.exports = {
  ensureSchema,
  earnPoints,
  redeemPoints,
  getLeaderboard,
  PointsError
};
