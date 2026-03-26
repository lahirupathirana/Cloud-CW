const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');

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

const APPROVAL_THRESHOLD = 3;
const SALARY_SERVICE_URL = process.env.SALARY_SERVICE_URL || 'http://salary-service:3002';

app.post('/api/votes', async (req, res) => {
  const userId = req.headers['x-user-id']; // Proxied from BFF
  const { submission_id, vote_type } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!['UP', 'DOWN'].includes(vote_type)) return res.status(400).json({ error: 'Invalid vote type' });

  try {
    // Insert or update vote
    await prisma.vote.upsert({
      where: {
        submissionId_userId: {
          submissionId: parseInt(submission_id),
          userId: parseInt(userId)
        }
      },
      update: { voteType: vote_type },
      create: {
        submissionId: parseInt(submission_id),
        userId: parseInt(userId),
        voteType: vote_type
      }
    });

    // Count UP votes
    const upvotes = await prisma.vote.count({
      where: {
        submissionId: parseInt(submission_id),
        voteType: 'UP'
      }
    });

    if (upvotes >= APPROVAL_THRESHOLD) {
      // Notify Salary Service to approve
      try {
        await axios.put(`${SALARY_SERVICE_URL}/internal/submissions/${submission_id}/approve`);
      } catch (err) {
        console.error('Failed to communicate with salary service:', err.message);
      }
    }

    res.json({ success: true, upvotes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Vote Service running on port ${PORT}`);
});
