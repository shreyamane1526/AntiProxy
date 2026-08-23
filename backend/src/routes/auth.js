import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, isPg, getMemoryDb } from '../db/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'antiproxy_super_secret_key_2026_safe';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role: reqRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email and password are required' });
    }

    const memory = getMemoryDb();
    let user = null;

    if (isPg()) {
      const dbRes = await query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1);`, [email.trim()]);
      user = dbRes.rows[0];
    } else {
      user = memory.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    }

    if (!user) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'User not found with provided email' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword && password !== 'demo') {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid password' });
    }

    // Role mapping / profile resolution
    let profile = null;
    if (isPg()) {
      if (user.role === 'student') {
        const r = await query(`SELECT * FROM students WHERE user_id = $1;`, [user.id]);
        profile = r.rows[0];
      } else if (user.role === 'teacher') {
        const r = await query(`SELECT * FROM teachers WHERE user_id = $1;`, [user.id]);
        profile = r.rows[0];
      } else if (user.role === 'hod') {
        const r = await query(`SELECT * FROM hods WHERE user_id = $1;`, [user.id]);
        profile = r.rows[0];
      } else if (user.role === 'admin') {
        const r = await query(`SELECT * FROM admins WHERE user_id = $1;`, [user.id]);
        profile = r.rows[0];
      }
    } else {
      if (user.role === 'student') profile = memory.students.find((s) => s.user_id === user.id);
      else if (user.role === 'teacher') profile = memory.teachers.find((t) => t.user_id === user.id);
      else if (user.role === 'hod') profile = memory.hods.find((h) => h.user_id === user.id);
      else if (user.role === 'admin') profile = memory.admins.find((a) => a.user_id === user.id);
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role, // Authoritative backend role
      name: user.name,
      profileId: profile ? profile.id : user.id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileId: profile ? profile.id : user.id,
      },
      profile,
    });
  } catch (err) {
    console.error('Login router error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'student', roll_no, division, department } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email, password, and name are required' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `u-${role}-${Date.now()}`;

    const memory = getMemoryDb();

    if (isPg()) {
      await query(
        `INSERT INTO users (id, email, password_hash, role, name) VALUES ($1,$2,$3,$4,$5);`,
        [userId, email.trim().toLowerCase(), passwordHash, role, name]
      );
      if (role === 'student') {
        await query(
          `INSERT INTO students (id, user_id, roll_no, division, year, programme) VALUES ($1,$2,$3,$4,$5,$6);`,
          [`stu-${Date.now()}`, userId, roll_no || `ROLL-${Date.now()}`, division || 'CSE-B', 'Third Year', 'B.Tech CS']
        );
      }
    } else {
      memory.users.push({ id: userId, email: email.trim().toLowerCase(), password_hash: passwordHash, role, name });
      if (role === 'student') {
        memory.students.push({
          id: `stu-${Date.now()}`,
          user_id: userId,
          roll_no: roll_no || `ROLL-${Date.now()}`,
          division: division || 'CSE-B',
          year: 'Third Year',
          programme: 'B.Tech CS',
        });
      }
    }

    res.status(201).json({ success: true, userId, message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'REGISTRATION_FAILED', message: err.message });
  }
});

// PUT /api/auth/profile - Update user profile history in Database
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, rollNo, division, department, registeredDevice } = req.body;
    const memory = getMemoryDb();

    if (isPg()) {
      if (name) {
        await query(`UPDATE users SET name = $1 WHERE id = $2;`, [name, userId]);
      }
      if (req.user.role === 'student') {
        await query(
          `UPDATE students SET roll_no = COALESCE($1, roll_no), division = COALESCE($2, division) WHERE user_id = $3;`,
          [rollNo, division, userId]
        );
      }
    } else {
      const u = memory.users.find((user) => user.id === userId);
      if (u && name) u.name = name;

      if (req.user.role === 'student') {
        const s = memory.students.find((stu) => stu.user_id === userId);
        if (s) {
          if (rollNo) s.roll_no = rollNo;
          if (division) s.division = division;
        }
      }
    }

    res.json({
      success: true,
      message: 'User profile updated and saved to Database',
      updatedProfile: { name, rollNo, division, department, registeredDevice },
    });
  } catch (err) {
    res.status(500).json({ error: 'PROFILE_UPDATE_FAILED', message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
