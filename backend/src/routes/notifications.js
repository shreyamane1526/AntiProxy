import express from 'express';
import { query, isPg, getMemoryDb } from '../db/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const memory = getMemoryDb();

    let list = [];
    if (isPg()) {
      const dbRes = await query(
        `SELECT * FROM notifications WHERE user_id = $1 OR role = $2 ORDER BY created_at DESC;`,
        [userId, userRole]
      );
      list = dbRes.rows;
    } else {
      list = memory.notifications.filter((n) => n.user_id === userId || n.role === userRole);
    }

    res.json({ notifications: list });
  } catch (err) {
    res.status(500).json({ error: 'FETCH_NOTIFICATIONS_FAILED', message: err.message });
  }
});

export default router;
