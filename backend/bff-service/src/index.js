const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());

// Parse JSON body unless it's a proxy route that needs the stream
app.use((req, res, next) => {
  if (req.path.startsWith('/api/proxy')) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.get('/health/live', (req, res) => res.status(200).send('Alive'));
app.get('/health/ready', (req, res) => res.status(200).send('Ready'));

// Service URLs - configured to use internal K8s DNS like http://identity-service.app.svc.cluster.local when in K8s, else docker-compose name
const IDENTITY_URL = process.env.IDENTITY_URL || 'http://identity-service:3001';
const SALARY_URL = process.env.SALARY_URL || 'http://salary-service:3002';
const VOTE_URL = process.env.VOTE_URL || 'http://vote-service:3003';
const SEARCH_URL = process.env.SEARCH_URL || 'http://search-service:3004';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';

// Strictly verify JWT for protected routes (Like VOTE)
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
       if (err) return res.status(403).json({ error: 'Forbidden' });
       req.user = user;
       next();
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Proxies
// Public endpoints
app.use('/api/proxy/auth', createProxyMiddleware({ target: IDENTITY_URL, changeOrigin: true, pathRewrite: {'^/api/proxy/auth': '/auth'} }));
app.use('/api/proxy/submissions', createProxyMiddleware({ target: SALARY_URL, changeOrigin: true, pathRewrite: {'^/api/proxy/submissions': '/api/submissions'} }));
app.use('/api/proxy/search', createProxyMiddleware({ target: SEARCH_URL, changeOrigin: true, pathRewrite: {'^/api/proxy/search': '/api/search'} }));
app.use('/api/proxy/stats', createProxyMiddleware({ target: SEARCH_URL, changeOrigin: true, pathRewrite: {'^/api/proxy/stats': '/api/stats'} }));

// Protected endpoint - ONLY logged in users can VOTE
app.use('/api/proxy/votes', authenticateJWT, createProxyMiddleware({
  target: VOTE_URL,
  changeOrigin: true,
  pathRewrite: {'^/api/proxy/votes': '/api/votes'},
  onProxyReq: (proxyReq, req, res) => {
    // Inject the verified user ID for the vote-service
    if (req.user && req.user.userId) {
      proxyReq.setHeader('x-user-id', req.user.userId);
    }
  }
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BFF Service running on port ${PORT}`);
});
