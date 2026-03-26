const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.get('/health/live', (req, res) => res.status(200).send('Alive'));
app.get('/health/ready', (req, res) => res.status(200).send('Ready'));

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Search API (Read-optimized view of APPROVED salaries)
app.get('/api/search', async (req, res) => {
  const { keyword, minSalary, maxSalary, yearsExperience } = req.query;
  
  let query = "SELECT * FROM salary.submissions WHERE status = 'APPROVED'";
  let queryParams = [];
  let paramIndex = 1;

  if (keyword) {
    query += ` AND job_title ILIKE $${paramIndex}`;
    queryParams.push(`%${keyword}%`);
    paramIndex++;
  }

  if (minSalary) {
    query += ` AND base_salary >= $${paramIndex}`;
    queryParams.push(minSalary);
    paramIndex++;
  }

  try {
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Stats API
app.get('/api/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        job_title, 
        AVG(base_salary) as average_salary, 
        COUNT(*) as total_submissions 
      FROM salary.submissions 
      WHERE status = 'APPROVED' 
      GROUP BY job_title
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Search & Stats Service running on port ${PORT}`);
});
