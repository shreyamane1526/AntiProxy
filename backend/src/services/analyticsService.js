import { query, isPg, getMemoryDb } from '../db/db.js';

export class AnalyticsService {
  static async getStudentAnalytics(studentId) {
    const memory = getMemoryDb();

    if (isPg()) {
      const resolvedId = await query(`SELECT id FROM students WHERE id = $1 OR user_id = $1 LIMIT 1;`, [studentId]);
      const sid = resolvedId.rows[0]?.id || studentId;

      const enrRes = await query(
        `SELECT e.class_id, c.name as class_name, c.code as class_code,
                sub.id as subject_id, sub.name as subject_name, sub.code as subject_code
         FROM enrollments e
         JOIN classes c ON e.class_id = c.id
         JOIN teacher_subject_assignments tsa ON tsa.class_id = e.class_id
         JOIN subjects sub ON tsa.subject_id = sub.id
         WHERE e.student_id = $1;`,
        [sid]
      );
      const enrollments = enrRes.rows;

      const sessRes = await query(
        `SELECT id, class_id, subject_id, started_at, status FROM attendance_sessions WHERE status IN ('ENDED', 'EXPIRED');`
      );
      const sessions = sessRes.rows;

      const recRes = await query(
        `SELECT session_id, subject_id, status, timestamp FROM attendance_records WHERE student_id = $1;`,
        [sid]
      );
      const records = recRes.rows;

      const subjectMap = new Map();
      for (const enr of enrollments) {
        const key = enr.subject_id;
        if (!subjectMap.has(key)) {
          subjectMap.set(key, {
            id: enr.subject_id,
            code: enr.subject_code,
            name: enr.subject_name,
            classId: enr.class_id,
            attended: 0,
            total: 0,
          });
        }
      }

      for (const sess of sessions) {
        const sub = subjectMap.get(sess.subject_id);
        if (sub) {
          sub.total++;
          const present = records.find((r) => r.session_id === sess.id && r.status === 'present');
          if (present) sub.attended++;
        }
      }

      const subjectWise = Array.from(subjectMap.values()).map((s) => ({
        ...s,
        percent: s.total > 0 ? Number(((s.attended / s.total) * 100).toFixed(1)) : 0,
      }));

      const totalAttended = subjectWise.reduce((sum, s) => sum + s.attended, 0);
      const totalClasses = subjectWise.reduce((sum, s) => sum + s.total, 0);
      const overallPercent = totalClasses > 0 ? Number(((totalAttended / totalClasses) * 100).toFixed(1)) : 0;

      const weeklyTrend = await this._getWeeklyTrend(sid);
      const monthlyTrend = await this._getMonthlyTrend(sid);

      return {
        overallPercent,
        totalAttended,
        totalClasses,
        subjectWise,
        weeklyTrend,
        monthlyTrend,
        recentRecords: records.slice(0, 10),
      };
    }

    // Memory fallback
    const studentObj = memory.students?.find((s) => s.id === studentId || s.user_id === studentId);
    const sid = studentObj?.id || studentId;
    const records = (memory.attendance_records || []).filter((r) => r.student_id === sid);
    const enrs = (memory.enrollments || []).filter((e) => e.student_id === sid);
    const sessions = memory.attendance_sessions || [];

    const subjectMap = new Map();
    for (const e of enrs) {
      const cls = memory.classes?.find((c) => c.id === e.class_id);
      const tsa = (memory.teacher_subject_assignments || []).find((a) => a.class_id === e.class_id);
      const sub = tsa ? memory.subjects?.find((s) => s.id === tsa.subject_id) : null;
      if (sub && !subjectMap.has(sub.id)) {
        subjectMap.set(sub.id, { id: sub.id, code: sub.code, name: sub.name, attended: 0, total: 0 });
      }
    }

    for (const sess of sessions) {
      const sub = subjectMap.get(sess.subject_id);
      if (sub && ['ENDED', 'EXPIRED'].includes(sess.status)) {
        sub.total++;
        if (records.find((r) => r.session_id === sess.id && r.status === 'present')) sub.attended++;
      }
    }

    const subjectWise = Array.from(subjectMap.values()).map((s) => ({
      ...s,
      percent: s.total > 0 ? Number(((s.attended / s.total) * 100).toFixed(1)) : 0,
    }));

    const totalAttended = subjectWise.reduce((sum, s) => sum + s.attended, 0);
    const totalClasses = subjectWise.reduce((sum, s) => sum + s.total, 0);

    return {
      overallPercent: totalClasses > 0 ? Number(((totalAttended / totalClasses) * 100).toFixed(1)) : 0,
      totalAttended,
      totalClasses,
      subjectWise,
      weeklyTrend: [],
      monthlyTrend: [],
      recentRecords: records.slice(0, 10),
    };
  }

  static async _getWeeklyTrend(studentId) {
    if (!isPg()) return [];
    const res = await query(
      `SELECT 
         TO_CHAR(DATE_TRUNC('week', ar.timestamp), 'YYYY-MM-DD') as week_start,
         COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
         COUNT(*) as total_count
       FROM attendance_records ar
       WHERE ar.student_id = $1
       GROUP BY DATE_TRUNC('week', ar.timestamp)
       ORDER BY week_start DESC
       LIMIT 8;`,
      [studentId]
    );
    return res.rows.map((r, i) => ({
      label: `Week ${res.rows.length - i}`,
      attendance: r.total_count > 0 ? Number(((r.present_count / r.total_count) * 100).toFixed(1)) : 0,
    })).reverse();
  }

  static async _getMonthlyTrend(studentId) {
    if (!isPg()) return [];
    const res = await query(
      `SELECT 
         TO_CHAR(DATE_TRUNC('month', ar.timestamp), 'YYYY-MM') as month_key,
         TO_CHAR(DATE_TRUNC('month', ar.timestamp), 'Mon') as label,
         COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
         COUNT(*) as total_count
       FROM attendance_records ar
       WHERE ar.student_id = $1
       GROUP BY DATE_TRUNC('month', ar.timestamp)
       ORDER BY month_key DESC
       LIMIT 12;`,
      [studentId]
    );
    return res.rows.map((r) => ({
      label: r.label,
      attendance: r.total_count > 0 ? Number(((r.present_count / r.total_count) * 100).toFixed(1)) : 0,
    })).reverse();
  }

  static async getClassAnalytics(classId) {
    const memory = getMemoryDb();

    if (isPg()) {
      const classRes = await query(`SELECT id, name, code, division FROM classes WHERE id = $1;`, [classId]);
      const classInfo = classRes.rows[0] || { id: classId, name: 'Class', code: 'CS000', division: 'N/A' };

      const studentsRes = await query(
        `SELECT 
           s.id, u.name, s.roll_no,
           COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
           COUNT(DISTINCT asess.id) as total_sessions
         FROM enrollments e
         JOIN students s ON e.student_id = s.id
         JOIN users u ON s.user_id = u.id
         LEFT JOIN attendance_sessions asess ON asess.class_id = e.class_id AND asess.status IN ('ENDED', 'EXPIRED')
         LEFT JOIN attendance_records ar ON ar.student_id = s.id AND ar.session_id = asess.id
         WHERE e.class_id = $1
         GROUP BY s.id, u.name, s.roll_no
         ORDER BY s.roll_no;`,
        [classId]
      );

      const students = studentsRes.rows.map((s) => {
        const total = Number(s.total_sessions) || 0;
        const present = Number(s.present_count) || 0;
        const pct = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0;
        return {
          id: s.id,
          name: s.name,
          rollNo: s.roll_no,
          present,
          total,
          percent: pct,
          risk: pct < 60 ? 'CRITICAL' : pct < 75 ? 'HIGH' : pct < 85 ? 'MEDIUM' : 'LOW',
        };
      });

      const totalStudents = students.length;
      const avgPct = totalStudents > 0
        ? Number((students.reduce((sum, s) => sum + s.percent, 0) / totalStudents).toFixed(1))
        : 0;
      const defaulterCount = students.filter((s) => s.percent < 75).length;

      return {
        classId,
        className: `${classInfo.name} · ${classInfo.division}`,
        averageAttendance: avgPct,
        totalStudents,
        defaulterCount,
        students,
      };
    }

    const cls = memory.classes?.find((c) => c.id === classId);
    const enrolled = memory.enrollments?.filter((e) => e.class_id === classId) || [];
    const sessions = memory.attendance_sessions?.filter((s) => s.class_id === classId && ['ENDED', 'EXPIRED'].includes(s.status)) || [];
    const records = memory.attendance_records || [];

    const students = enrolled.map((e) => {
      const stu = memory.students?.find((s) => s.id === e.student_id);
      const user = stu ? memory.users?.find((u) => u.id === stu.user_id) : null;
      const presentCount = records.filter((r) => r.student_id === e.student_id && r.status === 'present' && sessions.some((s) => s.id === r.session_id)).length;
      const total = sessions.length;
      const pct = total > 0 ? Number(((presentCount / total) * 100).toFixed(1)) : 0;
      return {
        id: e.student_id,
        name: user?.name || 'Student',
        rollNo: stu?.roll_no || e.student_id,
        present: presentCount,
        total,
        percent: pct,
        risk: pct < 60 ? 'CRITICAL' : pct < 75 ? 'HIGH' : pct < 85 ? 'MEDIUM' : 'LOW',
      };
    });

    return {
      classId,
      className: `${cls?.name || 'Class'} · ${cls?.division || 'N/A'}`,
      averageAttendance: students.length > 0 ? Number((students.reduce((s, st) => s + st.percent, 0) / students.length).toFixed(1)) : 0,
      totalStudents: students.length,
      defaulterCount: students.filter((s) => s.percent < 75).length,
      students,
    };
  }

  static async getDepartmentAnalytics(deptId) {
    if (isPg()) {
      const deptRes = await query(`SELECT id, name, code FROM departments WHERE id = $1;`, [deptId]);
      const dept = deptRes.rows[0] || { id: deptId, name: 'Department', code: 'DEPT' };

      const classRes = await query(
        `SELECT c.id, c.name, c.code, c.division,
           (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id) as total_students,
           (SELECT COUNT(DISTINCT asess.id) FROM attendance_sessions asess WHERE asess.class_id = c.id AND asess.status IN ('ENDED', 'EXPIRED')) as total_sessions,
           (SELECT COUNT(*) FROM attendance_records ar
            JOIN attendance_sessions asess2 ON ar.session_id = asess2.id
            WHERE asess2.class_id = c.id AND ar.status = 'present') as total_present
         FROM classes c
         WHERE c.department_id = $1
         ORDER BY c.division;`,
        [deptId]
      );

      const divisions = classRes.rows.map((c) => {
        const total = Number(c.total_sessions) || 0;
        const present = Number(c.total_present) || 0;
        const students = Number(c.total_students) || 0;
        const totalPossible = students * total;
        const avg = totalPossible > 0 ? Number(((present / totalPossible) * 100).toFixed(1)) : 0;
        return {
          division: c.division,
          classId: c.id,
          className: c.name,
          average: avg,
          total: students,
          atRisk: 0,
        };
      });

      const totalStudents = divisions.reduce((sum, d) => sum + d.total, 0);
      const overallAverage = totalStudents > 0
        ? Number((divisions.reduce((sum, d) => sum + d.average * d.total, 0) / totalStudents).toFixed(1))
        : 0;

      return {
        department: dept.name,
        overallAverage,
        totalDivisions: divisions.length,
        totalStudents,
        atRiskCount: 0,
        divisions,
      };
    }

    return {
      department: 'Department',
      overallAverage: 0,
      totalDivisions: 0,
      totalStudents: 0,
      atRiskCount: 0,
      divisions: [],
    };
  }
}
