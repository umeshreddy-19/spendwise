const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const auth = require('../middleware/auth');

// GET all transactions with filters
router.get('/', auth, async (req, res) => {
  const { month, year, category_id, type, search, limit = 100, offset = 0 } = req.query;
  try {
    let conditions = ['t.user_id = $1'];
    let params = [req.userId];
    let i = 2;

    if (month && year) {
      conditions.push(`EXTRACT(MONTH FROM t.date)=$${i++} AND EXTRACT(YEAR FROM t.date)=$${i++}`);
      params.push(month, year);
    } else if (year) {
      conditions.push(`EXTRACT(YEAR FROM t.date)=$${i++}`);
      params.push(year);
    }
    if (category_id) { conditions.push(`t.category_id=$${i++}`); params.push(category_id); }
    if (type) { conditions.push(`t.type=$${i++}`); params.push(type); }
    if (search) { conditions.push(`t.description ILIKE $${i++}`); params.push(`%${search}%`); }

    const where = conditions.join(' AND ');
    const query = `
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE ${where}
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT $${i++} OFFSET $${i++}
    `;
    params.push(limit, offset);

    const countQuery = `SELECT COUNT(*) FROM transactions t WHERE ${where}`;
    const [rows, count] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);
    res.json({ transactions: rows.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single transaction
router.get('/:id', auth, async (req, res) => {
  const result = await pool.query(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t LEFT JOIN categories c ON t.category_id=c.id
     WHERE t.id=$1 AND t.user_id=$2`,
    [req.params.id, req.userId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// CREATE transaction
router.post('/', auth, [
  body('type').isIn(['income', 'expense']),
  body('amount').isFloat({ gt: 0 }),
  body('description').trim().notEmpty(),
  body('date').isDate(),
  body('category_id').isUUID(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { type, amount, description, notes, date, category_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, description, notes, date, category_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [req.userId, type, amount, description, notes || null, date, category_id]
    );
    const txn = result.rows[0];
    const cat = await pool.query('SELECT name,icon,color FROM categories WHERE id=$1', [category_id]);
    if (cat.rows.length) {
      txn.category_name = cat.rows[0].name;
      txn.category_icon = cat.rows[0].icon;
      txn.category_color = cat.rows[0].color;
    }
    res.status(201).json(txn);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE transaction
router.put('/:id', auth, [
  body('type').optional().isIn(['income', 'expense']),
  body('amount').optional().isFloat({ gt: 0 }),
  body('date').optional().isDate(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { type, amount, description, notes, date, category_id } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM transactions WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Not found' });

    const result = await pool.query(
      `UPDATE transactions SET
        type=COALESCE($1,type),
        amount=COALESCE($2,amount),
        description=COALESCE($3,description),
        notes=COALESCE($4,notes),
        date=COALESCE($5,date),
        category_id=COALESCE($6,category_id),
        updated_at=NOW()
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [type, amount, description, notes, date, category_id, req.params.id, req.userId]
    );
    const txn = result.rows[0];
    const cat = await pool.query('SELECT name,icon,color FROM categories WHERE id=$1', [txn.category_id]);
    if (cat.rows.length) {
      txn.category_name = cat.rows[0].name;
      txn.category_icon = cat.rows[0].icon;
      txn.category_color = cat.rows[0].color;
    }
    res.json(txn);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE transaction
router.delete('/:id', auth, async (req, res) => {
  const result = await pool.query(
    'DELETE FROM transactions WHERE id=$1 AND user_id=$2 RETURNING id',
    [req.params.id, req.userId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

// GET monthly summary
router.get('/summary/monthly', auth, async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  try {
    const result = await pool.query(`
      SELECT
        EXTRACT(MONTH FROM date) as month,
        type,
        SUM(amount) as total
      FROM transactions
      WHERE user_id=$1 AND EXTRACT(YEAR FROM date)=$2
      GROUP BY month, type
      ORDER BY month
    `, [req.userId, year]);

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1, income: 0, expense: 0
    }));
    result.rows.forEach(row => {
      const m = months[parseInt(row.month) - 1];
      m[row.type] = parseFloat(row.total);
    });
    res.json(months);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET category breakdown
router.get('/summary/categories', auth, async (req, res) => {
  const { month, year = new Date().getFullYear(), type = 'expense' } = req.query;
  try {
    let conditions = ['t.user_id=$1', `t.type=$2`, `EXTRACT(YEAR FROM t.date)=$3`];
    let params = [req.userId, type, year];
    if (month) { conditions.push(`EXTRACT(MONTH FROM t.date)=$4`); params.push(month); }

    const result = await pool.query(`
      SELECT c.id, c.name, c.icon, c.color, SUM(t.amount) as total, COUNT(t.id) as count
      FROM transactions t
      JOIN categories c ON t.category_id=c.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY total DESC
    `, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
