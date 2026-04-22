const router = require('express').Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// GET all categories for user
router.get('/', auth, async (req, res) => {
  const { type } = req.query;
  let query = 'SELECT * FROM categories WHERE user_id=$1';
  const params = [req.userId];
  if (type) { query += ' AND type=$2'; params.push(type); }
  query += ' ORDER BY is_default DESC, name ASC';
  const result = await pool.query(query, params);
  res.json(result.rows);
});

// CREATE category
router.post('/', auth, async (req, res) => {
  const { name, icon, color, type } = req.body;
  if (!name || !icon || !color || !type) return res.status(400).json({ error: 'All fields required' });
  const result = await pool.query(
    'INSERT INTO categories (user_id,name,icon,color,type) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.userId, name, icon, color, type]
  );
  res.status(201).json(result.rows[0]);
});

// UPDATE category
router.put('/:id', auth, async (req, res) => {
  const { name, icon, color } = req.body;
  const result = await pool.query(
    `UPDATE categories SET name=COALESCE($1,name), icon=COALESCE($2,icon), color=COALESCE($3,color)
     WHERE id=$4 AND user_id=$5 RETURNING *`,
    [name, icon, color, req.params.id, req.userId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// DELETE category
router.delete('/:id', auth, async (req, res) => {
  const cat = await pool.query('SELECT is_default FROM categories WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
  if (!cat.rows.length) return res.status(404).json({ error: 'Not found' });
  if (cat.rows[0].is_default) return res.status(400).json({ error: 'Cannot delete default categories' });
  await pool.query('DELETE FROM categories WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
