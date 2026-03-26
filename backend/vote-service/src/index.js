const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');

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

// Assume 5 upvotes makes it APPROVED
const APPROVAL_THRESHOLD = 5;
const SALARY_SERVICE_URL = process.env.SALARY_SERVICE_URL || 'http://salary-service:3002';

app.post('/api/votes', async (req, res) => {
  // Authentication check is done in BFF, bff passes user_id in headers
  const userId = req.headers['x-user-id'];
  const { submission_id, vote_type } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!['UP', 'DOWN'].includes(vote_type)) return res.status(400).json({ error: 'Invalid vote type' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Insert/Update vote
    await client.query(
      `INSERT INTO community.votes (submission_id, user_id, vote_type) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (submission_id, user_id) 
       DO UPDATE SET vote_type = EXCLUDED.vote_type`,
      [submission_id, userId, vote_type]
    );

    // Count UP votes
    const countResult = await client.query(
      "SELECT COUNT(*) as upvotes FROM community.votes WHERE submission_id = $1 AND vote_type = 'UP'",
      [submission_id]
    );

    const upvotes = parseInt(countResult.rows[0].upvotes, 10);

    if (upvotes >= APPROVAL_THRESHOLD) {
      // Notify Salary Service to approve
      try {
        await axios.put(`${SALARY_SERVICE_URL}/internal/submissions/${submission_id}/approve`);
      } catch (err) {
        console.error('Failed to communicate with salary service:', err.message);
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, upvotes });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Vote Service running on port ${PORT}`);
});
