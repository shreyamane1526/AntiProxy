import { query, isPg, getMemoryDb } from '../db/db.js';

export class AnalyticsService {
  static async getStudentAnalytics(studentId) {
    const memory = getMemoryDb();
    let records = [];

    if (isPg()) {
      const res = await query(
        `SELECT ar.*, s.name as subject_name, s.code as subject_code 
         FROM attendance_records ar
         LEFT JOIN subjects s ON ar.subject_id = s.id
         WHERE ar.student_id = $1;`,
        [studentId]
      );
      records = res.rows;
    } else {
      records = memory.attendance_records.filter((r) => r.student_id === studentId);
    }

    // Default calculations or sample dataset integration
    const subjects = [
      { id: 'sub-dbms', code: 'CS301', name: 'DBMS', attended: 20, total: 22 },
      { id: 'sub-cn', code: 'CS302', name: 'Computer Networks', attended: 18, total: 23 },
      { id: 'sub-daa', code: 'CS303', name: 'DAA', attended: 16, total: 22 },
      { id: 'sub-os', code: 'CS304', name: 'Operating Systems', attended: 19, total: 22 },
      { id: 'sub-ai', code: 'CS305', name: 'AI', attended: 17, total: 21 },
    ];

    const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
    const totalClasses = subjects.reduce((sum, s) => sum + s.total, 0);
    const overallPercent = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 82.5;

    return {
      overallPercent: Number(overallPercent.toFixed(1)),
      totalAttended,
      totalClasses,
      subjectWise: subjects,
      weeklyTrend: [
        { label: 'Week 1', attendance: 84 },
        { label: 'Week 2', attendance: 86 },
        { label: 'Week 3', attendance: 82 },
        { label: 'Week 4', attendance: 79 },
        { label: 'Week 5', attendance: 82 },
        { label: 'Week 6', attendance: 81 },
      ],
      monthlyTrend: [
        { label: 'Jan', attendance: 88 },
        { label: 'Feb', attendance: 85 },
        { label: 'Mar', attendance: 83 },
        { label: 'Apr', attendance: 80 },
        { label: 'May', attendance: 82 },
      ],
      recentRecords: records.slice(0, 10),
    };
  }

  static async getClassAnalytics(classId) {
    return {
      classId: classId || 'class-dbms-b',
      className: 'DBMS · CSE-B',
      averageAttendance: 81.4,
      totalStudents: 8,
      defaulterCount: 2,
      students: [
        { id: 's1', name: 'Aanya Sharma', rollNo: '21CSB042', present: 20, total: 22, percent: 90.9, risk: 'LOW' },
        { id: 's2', name: 'Rohan Patel', rollNo: '21CSB018', present: 16, total: 22, percent: 72.7, risk: 'HIGH' },
        { id: 's3', name: 'Meera Joshi', rollNo: '21CSB031', present: 21, total: 22, percent: 95.5, risk: 'LOW' },
        { id: 's4', name: 'Kabir Singh', rollNo: '21CSB007', present: 14, total: 22, percent: 63.6, risk: 'CRITICAL' },
        { id: 's5', name: 'Ishita Rao', rollNo: '21CSB055', present: 19, total: 22, percent: 86.4, risk: 'LOW' },
        { id: 's6', name: 'Dev Malhotra', rollNo: '21CSB012', present: 17, total: 22, percent: 77.3, risk: 'MEDIUM' },
        { id: 's7', name: 'Sana Qureshi', rollNo: '21CSB028', present: 13, total: 22, percent: 59.1, risk: 'CRITICAL' },
        { id: 's8', name: 'Arjun Menon', rollNo: '21CSB041', present: 18, total: 22, percent: 81.8, risk: 'LOW' },
      ],
    };
  }

  static async getDepartmentAnalytics(deptId) {
    return {
      department: 'Computer Science & Engineering',
      overallAverage: 82.3,
      totalDivisions: 4,
      totalStudents: 180,
      atRiskCount: 14,
      divisions: [
        { division: 'CSE-A', average: 84.1, total: 45, atRisk: 3 },
        { division: 'CSE-B', average: 81.4, total: 45, atRisk: 5 },
        { division: 'CSE-C', average: 83.0, total: 45, atRisk: 2 },
        { division: 'CSE-D', average: 80.8, total: 45, atRisk: 4 },
      ],
    };
  }
}
