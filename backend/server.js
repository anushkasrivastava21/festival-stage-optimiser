require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const routes = require('./routes');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/festival_db'
});

// Make pool available to routes
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

app.use('/api', routes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Festival Stage Optimizer backend running on port ${PORT}`);
});
