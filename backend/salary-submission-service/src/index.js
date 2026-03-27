const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const cors = require('cors');
const Joi = require('joi');

dotenv.config();

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(cors());

app.get('/health/live', (req, res) => res.status(200).send('Alive'));
app.get('/health/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).send('Ready');
  } catch (e) {
    res.status(500).send('Not Ready');
  }
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
    const userId = req.headers['x-user-id'];
    
    const submission = await prisma.submission.create({
      data: {
        jobTitle: job_title,
        companyName: company_name,
        yearsOfExperience: years_of_experience,
        baseSalary: base_salary,
        status: 'PENDING',
        userId: userId ? parseInt(userId) : null
      }
    });
    
    res.status(201).json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/submissions', async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/internal/submissions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: parseInt(id) }
    });
    if (!submission) return res.status(404).json({ error: 'Not found' });
    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/internal/submissions/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const submission = await prisma.submission.update({
      where: { id: parseInt(id) },
      data: { status: 'APPROVED' }
    });
    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Salary Submission Service running on port ${PORT}`);
});
