require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/categories',   require('./routes/categories'));
app.use('/api/budgets',      require('./routes/budgets'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 SpendWise API running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});
