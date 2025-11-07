import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'aafl-demo-secret';

// POST /api/auth/login
// Demo-friendly auth:
// - Visitors: no password required; just provide a name/email (optional)
// - Admin/Federation: checks by email; accepts default demo passwords
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body || {};
    const userRole = role || 'visitor';

    if (userRole === 'visitor') {
      const safeEmail = email && typeof email === 'string' ? email : 'visitor@aafl.local';
      const name = req.body?.name || 'Visitor';
      const token = jwt.sign({ email: safeEmail, role: 'visitor', name }, JWT_SECRET, { expiresIn: '12h' });
      return res.json({ token, user: { email: safeEmail, role: 'visitor', name } });
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Demo password rules (seeded users have dummy hashes)
    const rolePwd = user.role === 'administrator' ? 'admin123' : user.role === 'federation' ? 'fed123' : null;
    if (!rolePwd || password !== rolePwd) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, user: { email: user.email, role: user.role, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// POST /api/auth/register
// Register a new federation
router.post('/register', async (req, res) => {
  try {
    const { federationName, country, contactPerson, email, password, role } = req.body || {};
    
    console.log('[AUTH] Registration request:', { federationName, country, contactPerson, email, role });
    
    // Validation
    if (!federationName || !country || !contactPerson || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered. Please use a different email or login.' });
    }
    
    // Create new user
    const newUser = new User({
      email,
      name: contactPerson,
      role: 'federation',
      passwordHash: 'demo-hash', // In production, use bcrypt
      metadata: {
        federationName,
        country,
        registeredAt: new Date()
      }
    });
    
    await newUser.save();
    console.log('[AUTH] New federation registered:', email);
    
    // Generate token
    const token = jwt.sign({ 
      email: newUser.email, 
      role: newUser.role, 
      name: newUser.name 
    }, JWT_SECRET, { expiresIn: '12h' });
    
    return res.status(201).json({ 
      token, 
      user: { 
        email: newUser.email, 
        role: newUser.role, 
        name: newUser.name,
        federationName,
        country
      },
      message: 'Registration successful! Welcome to AAFL.'
    });
    
  } catch (err) {
    console.error('[AUTH] Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.', details: err.message });
  }
});

export default router;
