/**
 * Rule-Based Risk Intelligence Service
 * Computes risk level (LOW, MEDIUM, HIGH, CRITICAL) for a student based on:
 * - Attendance percentage
 * - Recent absence trend
 * - Consecutive absences streak
 */
export class RiskService {
  static computeStudentRisk({ attendancePercent, totalClasses, totalAttended, consecutiveAbsences = 0 }) {
    const reasons = [];
    let level = 'LOW';

    if (attendancePercent < 70 || consecutiveAbsences >= 4) {
      level = 'CRITICAL';
      reasons.push(`Critical attendance deficit (${attendancePercent.toFixed(1)}%). Defaulter list threshold breached.`);
      if (consecutiveAbsences >= 4) {
        reasons.push(`${consecutiveAbsences} consecutive class absences recorded.`);
      }
    } else if (attendancePercent < 75 || consecutiveAbsences >= 3) {
      level = 'HIGH';
      reasons.push(`Attendance is below minimum required 75% (${attendancePercent.toFixed(1)}%).`);
      if (consecutiveAbsences >= 3) {
        reasons.push(`Streak of ${consecutiveAbsences} consecutive missed classes.`);
      }
    } else if (attendancePercent < 80 || consecutiveAbsences >= 2) {
      level = 'MEDIUM';
      reasons.push(`Attendance warning zone (${attendancePercent.toFixed(1)}%). Near minimum threshold.`);
      if (consecutiveAbsences >= 2) {
        reasons.push(`2 consecutive absences detected.`);
      }
    } else {
      level = 'LOW';
      reasons.push(`Healthy attendance record (${attendancePercent.toFixed(1)}%).`);
    }

    return {
      scoreLevel: level,
      attendancePercent,
      consecutiveAbsences,
      reasons,
      calculatedAt: new Date().toISOString(),
    };
  }
}
