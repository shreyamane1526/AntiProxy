import express from 'express';
import { query, isPg, getMemoryDb } from '../db/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// GET /api/rules
router.get('/', authenticateToken, async (req, res) => {
  try {
    const memory = getMemoryDb();
    let rules = [];

    if (isPg()) {
      const dbRes = await query(`SELECT * FROM attendance_rules ORDER BY threshold_percent DESC;`);
      rules = dbRes.rows;
    } else {
      rules = memory.attendance_rules;
    }

    res.json({ rules });
  } catch (err) {
    res.status(500).json({ error: 'FETCH_RULES_FAILED', message: err.message });
  }
});

// POST /api/rules
router.post('/', authenticateToken, authorizeRoles('hod', 'admin'), async (req, res) => {
  try {
    const { name, thresholdPercent, consecutiveAbsences, action, targetRole } = req.body;
    const ruleId = `rule-${Date.now()}`;
    const memory = getMemoryDb();

    const newRule = {
      id: ruleId,
      name,
      threshold_percent: Number(thresholdPercent),
      consecutive_absences: Number(consecutiveAbsences || 0),
      action,
      target_role: targetRole || 'student',
      enabled: true,
    };

    if (isPg()) {
      await query(
        `INSERT INTO attendance_rules (id, name, threshold_percent, consecutive_absences, action, target_role, enabled) VALUES ($1,$2,$3,$4,$5,$6,$7);`,
        [newRule.id, newRule.name, newRule.threshold_percent, newRule.consecutive_absences, newRule.action, newRule.target_role, newRule.enabled]
      );
    } else {
      memory.attendance_rules.push(newRule);
    }

    res.status(201).json({ success: true, rule: newRule });
  } catch (err) {
    res.status(500).json({ error: 'CREATE_RULE_FAILED', message: err.message });
  }
});

// PUT /api/rules/:id
router.put('/:id', authenticateToken, authorizeRoles('hod', 'admin'), async (req, res) => {
  try {
    const ruleId = req.params.id;
    const { enabled, thresholdPercent } = req.body;
    const memory = getMemoryDb();

    if (isPg()) {
      await query(`UPDATE attendance_rules SET enabled = $1, threshold_percent = COALESCE($2, threshold_percent) WHERE id = $3;`, [enabled, thresholdPercent, ruleId]);
    } else {
      const rule = memory.attendance_rules.find((r) => r.id === ruleId);
      if (rule) {
        if (enabled !== undefined) rule.enabled = Boolean(enabled);
        if (thresholdPercent !== undefined) rule.threshold_percent = Number(thresholdPercent);
      }
    }

    res.json({ success: true, message: 'Attendance rule updated' });
  } catch (err) {
    res.status(500).json({ error: 'UPDATE_RULE_FAILED', message: err.message });
  }
});

export default router;
