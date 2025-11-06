const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static front-end files from repo root
app.use(express.static(path.join(__dirname)));

// Simple in-memory user store (demo only)
const USERS = [
  { email: 'admin@aurafootball.com', password: 'admin123', role: 'administrator', name: 'League Administrator' },
  { email: 'federation@africa.com', password: 'fed123', role: 'federation', name: 'African Football Federation' },
  { email: 'visitor@example.com', password: 'visitor123', role: 'visitor', name: 'Football Fan' }
];

const JWT_SECRET = 'change-this-to-a-secure-secret';

// POST /api/login -> { token, user }
app.post('/api/login', (req, res) => {
  const { email, password, role } = req.body || {};

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'email, password and role are required' });
  }

  const user = USERS.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.role !== role) return res.status(403).json({ error: 'Role mismatch' });

  const token = jwt.sign({ email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '2h' });

  res.json({ token, user: { email: user.email, role: user.role, name: user.name } });
});

// Simple endpoint to verify token
app.get('/api/me', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return res.json({ user: payload });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth server started on http://localhost:${PORT}`);
});
