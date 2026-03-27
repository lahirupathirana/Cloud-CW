const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const cors = require('cors');

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


app.get('/api/stats', async (req, res) => {
  try {
    const aggregate = await prisma.submission.groupBy({
      by: ['jobTitle'],
      where: { status: 'APPROVED' },
      _avg: { baseSalary: true, yearsOfExperience: true },
      _count: { id: true }
    });

    const results = aggregate.map(stat => ({
      job_title: stat.jobTitle,
      average_salary: stat._avg.baseSalary,
      average_experience: stat._avg.yearsOfExperience,
      total_submissions: stat._count.id
    }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Stats Service running on port ${PORT}`);
});
