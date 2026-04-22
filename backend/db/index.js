const { Pool } = require('pg');


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  // always on, not conditional
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    // Drop indexes first if they exist (safe re-run)
    await client.query(`DROP INDEX IF EXISTS idx_transactions_user_date`);
    await client.query(`DROP INDEX IF EXISTS idx_transactions_category`);

    // Create tables one at a time in dependency order
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        currency VARCHAR(10) DEFAULT '₹',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(10) NOT NULL,
        color VARCHAR(20) NOT NULL,
        type VARCHAR(10) CHECK (type IN ('income','expense')) NOT NULL,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        type VARCHAR(10) CHECK (type IN ('income','expense')) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        description VARCHAR(255) NOT NULL,
        notes TEXT,
        date DATE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
        amount NUMERIC(12,2) NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, category_id, month, year)
      )
    `);

    // Indexes last — tables guaranteed to exist by this point
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions (user_id, date)`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category_id)`
    );

    console.log('✅ Database initialized');
  } catch (err) {
    console.error('initDB error:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

const seedDefaultCategories = async (userId) => {
  const defaults = [
    { name: 'Salary',        icon: '💼', color: '#10b981', type: 'income' },
    { name: 'Freelance',     icon: '💻', color: '#06b6d4', type: 'income' },
    { name: 'Investment',    icon: '📈', color: '#8b5cf6', type: 'income' },
    { name: 'Gift',          icon: '🎁', color: '#f59e0b', type: 'income' },
    { name: 'Other Income',  icon: '➕', color: '#84cc16', type: 'income' },
    { name: 'Food',          icon: '🍔', color: '#ef4444', type: 'expense' },
    { name: 'Transport',     icon: '🚌', color: '#f97316', type: 'expense' },
    { name: 'Housing',       icon: '🏠', color: '#8b5cf6', type: 'expense' },
    { name: 'Health',        icon: '💊', color: '#ec4899', type: 'expense' },
    { name: 'Shopping',      icon: '🛍️', color: '#06b6d4', type: 'expense' },
    { name: 'Entertainment', icon: '🎬', color: '#f59e0b', type: 'expense' },
    { name: 'Education',     icon: '📚', color: '#3b82f6', type: 'expense' },
    { name: 'Utilities',     icon: '💡', color: '#64748b', type: 'expense' },
    { name: 'Other',         icon: '📦', color: '#94a3b8', type: 'expense' },
  ];
  for (const cat of defaults) {
    await pool.query(
      `INSERT INTO categories (user_id, name, icon, color, type, is_default)
       VALUES ($1,$2,$3,$4,$5,true) ON CONFLICT DO NOTHING`,
      [userId, cat.name, cat.icon, cat.color, cat.type]
    );
  }
};

module.exports = { pool, initDB, seedDefaultCategories };
