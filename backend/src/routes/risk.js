import express from 'express';
import { RiskService } from '../services/riskService.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/risk/student/:id
router.get('/student/:id', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id || req.user.profileId;
    const analytics = await AnalyticsService.getStudentAnalytics(studentId);
    
    const risk = RiskService.computeStudentRisk({
      attendancePercent: analytics.overallPercent,
      totalClasses: analytics.totalClasses,
      totalAttended: analytics.totalAttended,
      consecutiveAbsences: 1,
    });

    res.json({ studentId, ...risk });
  } catch (err) {
    res.status(500).json({ error: 'RISK_COMPUTATION_FAILED', message: err.message });
  }
});

export default router;
