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

app.get('/api/search', async (req, res) => {
  const { keyword, minSalary } = req.query;
  
  const whereClause = { status: 'APPROVED' };
  
  if (keyword) {
    whereClause.jobTitle = { contains: keyword, mode: 'insensitive' };
  }
  if (minSalary) {
    whereClause.baseSalary = { gte: parseFloat(minSalary) };
  }

  try {
    const results = await prisma.submission.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      // Note: Do not return exact company_name to strictly preserve anonymity in UI if required, 
      // though anonymize toggle strips it at submission as well.
    });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Search Service running on port ${PORT}`);
});
