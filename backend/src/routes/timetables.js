// timetables.js – CRUD routes for class timetables
import express from 'express';
import { query, isPg, getMemoryDb } from '../db/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Helper to format timetable records
function formatTimetable(tt) {
  if (!tt) return null;
  const startStr = tt.start_time || tt.startTime || '09:00:00';
  const endStr = tt.end_time || tt.endTime || '10:00:00';
  const startHour = parseInt(startStr.split(':')[0], 10);
  const endHour = parseInt(endStr.split(':')[0], 10);
  const duration = Math.max(1, endHour - startHour);

  return {
    id: tt.id,
    classId: tt.class_id || tt.classId,
    teacherId: tt.teacher_id || tt.teacherId,
    teacher: tt.teacher_name || tt.teacher || 'Teacher',
    subjectId: tt.subject_id || tt.subjectId,
    subject: tt.subject_name || tt.subject || 'Subject',
    code: tt.subject_code || tt.code || 'CS301',
    division: tt.class_division || tt.division || 'CSE-A',
    day: tt.day_of_week || tt.dayOfWeek,
    dayOfWeek: tt.day_of_week || tt.dayOfWeek,
    startTime: startStr,
    endTime: endStr,
    startHour,
    duration,
    room: tt.room,
    type: 'Lecture',
  };
}

// GET all timetables – accessible to any authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { classId, teacherId, studentId } = req.query;
    const memory = getMemoryDb();
    let rows = [];

    if (isPg()) {
      let sql = `
        SELECT 
          t.id,
          t.class_id,
          t.teacher_id,
          t.subject_id,
          t.day_of_week,
          t.start_time,
          t.end_time,
          t.room,
          c.division as class_division,
          c.code as class_code,
          s.name as subject_name,
          s.code as subject_code,
          u.name as teacher_name
        FROM timetables t
        JOIN classes c ON t.class_id = c.id
        JOIN subjects s ON t.subject_id = s.id
        JOIN teachers tch ON t.teacher_id = tch.id
        JOIN users u ON tch.user_id = u.id
      `;

      const params = [];
      const conditions = [];

      if (classId) {
        params.push(classId);
        conditions.push(`(t.class_id = $${params.length} OR c.division = $${params.length} OR c.code = $${params.length})`);
      }
      if (teacherId) {
        params.push(teacherId);
        conditions.push(`(t.teacher_id = $${params.length} OR tch.user_id = $${params.length})`);
      }
      if (studentId) {
        const stuRes = await query(
          `SELECT e.class_id FROM enrollments e JOIN students s ON s.id = e.student_id WHERE s.id = $1 OR s.user_id = $1;`,
          [studentId]
        );
        if (stuRes.rows.length > 0) {
          params.push(stuRes.rows[0].class_id);
          conditions.push(`t.class_id = $${params.length}`);
        }
      }

      if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ');
      }

      sql += ` ORDER BY t.day_of_week, t.start_time;`;
      const dbRes = await query(sql, params);
      rows = dbRes.rows;
    } else {
      rows = memory.timetables.map((tt) => {
        const cls = memory.classes.find((c) => c.id === tt.class_id);
        const sub = memory.subjects.find((s) => s.id === tt.subject_id);
        const tch = memory.teachers.find((t) => t.id === tt.teacher_id);
        const usr = tch ? memory.users.find((u) => u.id === tch.user_id) : null;
        return {
          ...tt,
          class_division: cls ? cls.division : 'CSE-A',
          class_code: cls ? cls.code : 'CSE-A',
          subject_name: sub ? sub.name : 'Subject',
          subject_code: sub ? sub.code : 'CS301',
          teacher_name: usr ? usr.name : (tch ? tch.designation : 'Teacher'),
        };
      });

      if (classId) {
        rows = rows.filter((r) => r.class_id === classId || r.class_division === classId || r.class_code === classId);
      }
      if (teacherId) {
        rows = rows.filter((r) => r.teacher_id === teacherId || r.user_id === teacherId);
      }
      if (studentId) {
        const stu = memory.students.find((s) => s.id === studentId || s.user_id === studentId);
        if (stu) {
          const enr = memory.enrollments.find((e) => e.student_id === stu.id);
          if (enr) {
            rows = rows.filter((r) => r.class_id === enr.class_id);
          }
        }
      }
    }
    const result = rows.map(formatTimetable);
    res.json({ timetables: result });
  } catch (err) {
    console.error('Fetch timetables error:', err);
    res.status(500).json({ error: 'FETCH_TIMETABLES_FAILED', message: err.message });
  }
});

// GET a single timetable by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const memory = getMemoryDb();
    let tt = null;
    if (isPg()) {
      const dbRes = await query('SELECT * FROM timetables WHERE id = $1;', [id]);
      tt = dbRes.rows[0];
    } else {
      tt = memory.timetables.find((t) => t.id === id);
    }
    if (!tt) return res.status(404).json({ error: 'TIMETABLE_NOT_FOUND' });
    res.json({ timetable: formatTimetable(tt) });
  } catch (err) {
    console.error('Fetch timetable error:', err);
    res.status(500).json({ error: 'FETCH_TIMETABLE_FAILED', message: err.message });
  }
});

// CREATE a new timetable – only HOD or admin can create
router.post('/', authenticateToken, authorizeRoles('hod', 'admin'), async (req, res) => {
  try {
    const {
      classId,
      teacherId,
      subjectId,
      dayOfWeek,
      startTime,
      endTime,
      room,
    } = req.body;
    if (!classId || !teacherId || !subjectId || !dayOfWeek || !startTime || !endTime || !room) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'All timetable fields required' });
    }
    const id = `tt-${Date.now()}`;
    const memory = getMemoryDb();
    if (isPg()) {
      await query(
        `INSERT INTO timetables (id, class_id, teacher_id, subject_id, day_of_week, start_time, end_time, room)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8);`,
        [id, classId, teacherId, subjectId, dayOfWeek, startTime, endTime, room]
      );
    } else {
      memory.timetables.push({
        id,
        class_id: classId,
        teacher_id: teacherId,
        subject_id: subjectId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        room,
      });
    }
    res.status(201).json({ success: true, timetableId: id });
  } catch (err) {
    console.error('Create timetable error:', err);
    res.status(500).json({ error: 'CREATE_TIMETABLE_FAILED', message: err.message });
  }
});

// UPDATE an existing timetable – HOD or admin only
router.put('/:id', authenticateToken, authorizeRoles('hod', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      classId,
      teacherId,
      subjectId,
      dayOfWeek,
      startTime,
      endTime,
      room,
    } = req.body;

    const memory = getMemoryDb();
    if (isPg()) {
      // Build dynamic SET clause based on provided fields
      const fields = [];
      const values = [];
      let idx = 1;
      if (classId) { fields.push(`class_id = $${idx++}`); values.push(classId); }
      if (teacherId) { fields.push(`teacher_id = $${idx++}`); values.push(teacherId); }
      if (subjectId) { fields.push(`subject_id = $${idx++}`); values.push(subjectId); }
      if (dayOfWeek) { fields.push(`day_of_week = $${idx++}`); values.push(dayOfWeek); }
      if (startTime) { fields.push(`start_time = $${idx++}`); values.push(startTime); }
      if (endTime) { fields.push(`end_time = $${idx++}`); values.push(endTime); }
      if (room) { fields.push(`room = $${idx++}`); values.push(room); }
      if (fields.length === 0) return res.status(400).json({ error: 'NO_FIELDS', message: 'No update fields supplied' });
      values.push(id); // for WHERE clause
      const setClause = fields.join(', ');
      await query(`UPDATE timetables SET ${setClause} WHERE id = $${idx};`, values);
    } else {
      const tt = memory.timetables.find((t) => t.id === id);
      if (!tt) return res.status(404).json({ error: 'TIMETABLE_NOT_FOUND' });
      if (classId) tt.class_id = classId;
      if (teacherId) tt.teacher_id = teacherId;
      if (subjectId) tt.subject_id = subjectId;
      if (dayOfWeek) tt.day_of_week = dayOfWeek;
      if (startTime) tt.start_time = startTime;
      if (endTime) tt.end_time = endTime;
      if (room) tt.room = room;
    }
    res.json({ success: true, message: 'Timetable updated' });
  } catch (err) {
    console.error('Update timetable error:', err);
    res.status(500).json({ error: 'UPDATE_TIMETABLE_FAILED', message: err.message });
  }
});

// DELETE a timetable – HOD or admin only
router.delete('/:id', authenticateToken, authorizeRoles('hod', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const memory = getMemoryDb();
    if (isPg()) {
      await query('DELETE FROM timetables WHERE id = $1;', [id]);
    } else {
      const idx = memory.timetables.findIndex((t) => t.id === id);
      if (idx >= 0) memory.timetables.splice(idx, 1);
    }
    res.json({ success: true, message: 'Timetable deleted' });
  } catch (err) {
    console.error('Delete timetable error:', err);
    res.status(500).json({ error: 'DELETE_TIMETABLE_FAILED', message: err.message });
  }
});

export default router;
