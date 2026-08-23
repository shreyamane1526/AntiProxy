import express from 'express';
import { AnalyticsService } from '../services/analyticsService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/analytics/student/:id
router.get('/student/:id', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id || req.user.profileId;
    const analytics = await AnalyticsService.getStudentAnalytics(studentId);
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: 'STUDENT_ANALYTICS_FAILED', message: err.message });
  }
});

// GET /api/analytics/class/:id
router.get('/class/:id', authenticateToken, async (req, res) => {
  try {
    const classId = req.params.id;
    const analytics = await AnalyticsService.getClassAnalytics(classId);
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: 'CLASS_ANALYTICS_FAILED', message: err.message });
  }
});

// GET /api/analytics/department/:id
router.get('/department/:id', authenticateToken, async (req, res) => {
  try {
    const deptId = req.params.id;
    const analytics = await AnalyticsService.getDepartmentAnalytics(deptId);
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: 'DEPARTMENT_ANALYTICS_FAILED', message: err.message });
  }
});

export default router;
