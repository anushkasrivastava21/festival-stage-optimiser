require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const stageRoutes = require('./routes/stages');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// DB Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/festival'
});

// Pass pool to routes
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// Routes
app.use('/stages', stageRoutes);

app.listen(port, () => {
  console.log(`Festival Stage Optimizer backend running on port ${port}`);
});
