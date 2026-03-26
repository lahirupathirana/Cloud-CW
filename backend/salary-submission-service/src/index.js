const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const cors = require('cors');
const Joi = require('joi');

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

const submissionSchema = Joi.object({
  job_title: Joi.string().required(),
  company_name: Joi.string().allow('', null).optional(),
  years_of_experience: Joi.number().integer().min(0).required(),
  base_salary: Joi.number().positive().required(),
});

app.post('/api/submissions', async (req, res) => {
  try {
    const { error, value } = submissionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { job_title, company_name, years_of_experience, base_salary } = value;
    
    const result = await pool.query(
      'INSERT INTO salary.submissions (job_title, company_name, years_of_experience, base_salary) VALUES ($1, $2, $3, $4) RETURNING id, status',
      [job_title, company_name, years_of_experience, base_salary]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/internal/submissions/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE salary.submissions SET status = 'APPROVED' WHERE id = $1 RETURNING id, status",
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Salary Submission Service running on port ${PORT}`);
});
