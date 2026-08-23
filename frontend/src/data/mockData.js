export const users = [
  {
    id: "u-student-1",
    role: "student",
    name: "Aanya Sharma",
    email: "aanya.sharma@college.edu",
    password: "demo",
  },
  {
    id: "u-teacher-1",
    role: "teacher",
    name: "Prof. R. Mehta",
    email: "r.mehta@college.edu",
    password: "demo",
  },
  {
    id: "u-hod-1",
    role: "hod",
    name: "Dr. Kavita Iyer",
    email: "hod.cse@college.edu",
    password: "demo",
  },
]

export const studentProfile = {
  id: "stu-21csb042",
  userId: "u-student-1",
  name: "Aanya Sharma",
  rollNo: "21CSB042",
  division: "CSE-B",
  year: "Third Year",
  programme: "B.Tech Computer Science",
  registeredDevice: "Aanya’s Pixel · BLE-4421",
  photoUrl: "https://randomuser.me/api/portraits/women/44.jpg",
}

export const teacherProfile = {
  id: "tch-mehta",
  userId: "u-teacher-1",
  name: "Prof. R. Mehta",
  department: "Computer Science",
  designation: "Associate Professor",
  employeeId: "CSE-1044",
  photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
}

export const hodProfile = {
  id: "hod-iyer",
  userId: "u-hod-1",
  name: "Dr. Kavita Iyer",
  department: "Computer Science",
  designation: "Head of Department",
  photoUrl: "https://randomuser.me/api/portraits/women/68.jpg",
}

export const subjects = [
  {
    id: "sub-dbms",
    code: "CS301",
    name: "DBMS",
    teacher: "Prof. R. Mehta",
    teacherId: "tch-mehta",
    division: "CSE-B",
    attended: 20,
    total: 22,
  },
  {
    id: "sub-cn",
    code: "CS302",
    name: "Computer Networks",
    teacher: "Prof. S. Nair",
    teacherId: "tch-nair",
    division: "CSE-B",
    attended: 18,
    total: 23,
  },
  {
    id: "sub-daa",
    code: "CS303",
    name: "DAA",
    teacher: "Dr. A. Kulkarni",
    teacherId: "tch-kulkarni",
    division: "CSE-B",
    attended: 16,
    total: 22,
  },
  {
    id: "sub-os",
    code: "CS304",
    name: "Operating Systems",
    teacher: "Prof. L. Banerjee",
    teacherId: "tch-banerjee",
    division: "CSE-B",
    attended: 19,
    total: 22,
  },
  {
    id: "sub-ai",
    code: "CS305",
    name: "AI",
    teacher: "Dr. P. Deshmukh",
    teacherId: "tch-deshmukh",
    division: "CSE-B",
    attended: 17,
    total: 21,
  },
]

export const weeklyTrend = [
  { label: "Week 1", attendance: 84 },
  { label: "Week 2", attendance: 86 },
  { label: "Week 3", attendance: 82 },
  { label: "Week 4", attendance: 79 },
  { label: "Week 5", attendance: 82 },
  { label: "Week 6", attendance: 81 },
]

export const monthlyTrend = [
  { label: "Jan", attendance: 88 },
  { label: "Feb", attendance: 85 },
  { label: "Mar", attendance: 83 },
  { label: "Apr", attendance: 80 },
  { label: "May", attendance: 82 },
]

export const studentTimetable = [
  { id: "stt-1", day: "Monday", startHour: 10, duration: 1, subject: "DBMS", teacher: "Prof. R. Mehta", room: "Lab 3 · Block C", type: "Lecture" },
  { id: "stt-2", day: "Monday", startHour: 11, duration: 1, subject: "Computer Networks", teacher: "Prof. S. Nair", room: "CR 204", type: "Lecture" },
  { id: "stt-3", day: "Monday", startHour: 14, duration: 1, subject: "Operating Systems", teacher: "Prof. L. Banerjee", room: "CR 118", type: "Lecture" },
  { id: "stt-4", day: "Tuesday", startHour: 9, duration: 1, subject: "DBMS", teacher: "Prof. R. Mehta", room: "CR 118", type: "Lecture" },
  { id: "stt-5", day: "Tuesday", startHour: 11, duration: 1, subject: "DAA", teacher: "Dr. A. Kulkarni", room: "CR 206", type: "Lecture" },
  { id: "stt-6", day: "Tuesday", startHour: 14, duration: 2, subject: "DBMS Lab", teacher: "Prof. R. Mehta", room: "Lab 3 · Block C", type: "Lab" },
  { id: "stt-7", day: "Wednesday", startHour: 9, duration: 1, subject: "Operating Systems", teacher: "Prof. L. Banerjee", room: "CR 118", type: "Lecture" },
  { id: "stt-8", day: "Wednesday", startHour: 11, duration: 1, subject: "AI", teacher: "Dr. P. Deshmukh", room: "CR 220", type: "Lecture" },
  { id: "stt-9", day: "Wednesday", startHour: 13, duration: 1, subject: "Computer Networks", teacher: "Prof. S. Nair", room: "CR 204", type: "Lecture" },
  { id: "stt-10", day: "Thursday", startHour: 10, duration: 1, subject: "DBMS", teacher: "Prof. R. Mehta", room: "CR 118", type: "Lecture" },
  { id: "stt-11", day: "Thursday", startHour: 13, duration: 1, subject: "DAA", teacher: "Dr. A. Kulkarni", room: "CR 206", type: "Lecture" },
  { id: "stt-12", day: "Thursday", startHour: 15, duration: 1, subject: "AI", teacher: "Dr. P. Deshmukh", room: "CR 220", type: "Lecture" },
  { id: "stt-13", day: "Friday", startHour: 10, duration: 1, subject: "Operating Systems", teacher: "Prof. L. Banerjee", room: "CR 118", type: "Lecture" },
  { id: "stt-14", day: "Friday", startHour: 13, duration: 1, subject: "DBMS", teacher: "Prof. R. Mehta", room: "CR 118", type: "Lecture" },
  { id: "stt-15", day: "Friday", startHour: 15, duration: 1, subject: "Computer Networks", teacher: "Prof. S. Nair", room: "CR 204", type: "Lecture" },
  { id: "stt-16", day: "Saturday", startHour: 10, duration: 2, subject: "DBMS Lab", teacher: "Prof. R. Mehta", room: "Lab 3 · Block C", type: "Lab" },
]

export const currentSession = {
  id: "sess-dbms-2026-08-23-10",
  subjectId: "sub-dbms",
  subject: "DBMS",
  teacher: "Prof. R. Mehta",
  division: "CSE-B",
  date: "22 August 2026",
  time: "10:00 AM",
  room: "Lab 3 · Block C",
  deviceName: "Classroom BLE · DBMS-LAB3",
  qrToken: "QR-DYN-DBMS-1044-0823",
  status: "open",
}

export const attendanceRecords = [
  { id: "ar-1", subjectId: "sub-dbms", date: "2026-08-18", status: "present", session: "10:00 AM" },
  { id: "ar-2", subjectId: "sub-dbms", date: "2026-08-20", status: "present", session: "10:00 AM" },
  { id: "ar-3", subjectId: "sub-cn", date: "2026-08-19", status: "absent", session: "11:15 AM" },
  { id: "ar-4", subjectId: "sub-daa", date: "2026-08-17", status: "absent", session: "09:00 AM" },
  { id: "ar-5", subjectId: "sub-daa", date: "2026-08-21", status: "present", session: "09:00 AM" },
  { id: "ar-6", subjectId: "sub-os", date: "2026-08-18", status: "present", session: "02:00 PM" },
  { id: "ar-7", subjectId: "sub-ai", date: "2026-08-21", status: "present", session: "03:15 PM" },
]

export const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
export const TIMETABLE_HOURS = [9, 10, 11, 12, 13, 14, 15, 16]

export const teacherClasses = [
  {
    id: "class-dbms-b",
    name: "DBMS",
    code: "CS301",
    division: "CSE-B",
    type: "Lecture",
    students: [
      { id: "s1", name: "Aanya Sharma", rollNo: "21CSB042", present: 20, total: 22 },
      { id: "s2", name: "Rohan Patel", rollNo: "21CSB018", present: 16, total: 22 },
      { id: "s3", name: "Meera Joshi", rollNo: "21CSB031", present: 21, total: 22 },
      { id: "s4", name: "Kabir Singh", rollNo: "21CSB007", present: 14, total: 22 },
      { id: "s5", name: "Ishita Rao", rollNo: "21CSB055", present: 19, total: 22 },
      { id: "s6", name: "Dev Malhotra", rollNo: "21CSB012", present: 17, total: 22 },
      { id: "s7", name: "Sana Qureshi", rollNo: "21CSB028", present: 13, total: 22 },
      { id: "s8", name: "Arjun Menon", rollNo: "21CSB041", present: 18, total: 22 },
    ],
  },
  {
    id: "class-dbms-a",
    name: "DBMS",
    code: "CS301",
    division: "CSE-A",
    type: "Lecture",
    students: [
      { id: "a1", name: "Neha Kapoor", rollNo: "21CSA009", present: 19, total: 21 },
      { id: "a2", name: "Yash Verma", rollNo: "21CSA022", present: 15, total: 21 },
      { id: "a3", name: "Priya Nair", rollNo: "21CSA014", present: 20, total: 21 },
      { id: "a4", name: "Harsh Gupta", rollNo: "21CSA033", present: 12, total: 21 },
      { id: "a5", name: "Ananya Iyer", rollNo: "21CSA041", present: 18, total: 21 },
      { id: "a6", name: "Vikram Shah", rollNo: "21CSA007", present: 16, total: 21 },
    ],
  },
  {
    id: "class-dbms-lab-b",
    name: "DBMS Lab",
    code: "CS301L",
    division: "CSE-B",
    type: "Lab",
    students: [
      { id: "s1", name: "Aanya Sharma", rollNo: "21CSB042", present: 10, total: 11 },
      { id: "s2", name: "Rohan Patel", rollNo: "21CSB018", present: 8, total: 11 },
      { id: "s3", name: "Meera Joshi", rollNo: "21CSB031", present: 11, total: 11 },
      { id: "s4", name: "Kabir Singh", rollNo: "21CSB007", present: 7, total: 11 },
      { id: "s5", name: "Ishita Rao", rollNo: "21CSB055", present: 9, total: 11 },
    ],
  },
]

export const teacherTimetable = [
  { id: "slot-1", day: "Monday", startHour: 10, duration: 1, classId: "class-dbms-b", room: "Lab 3 · Block C" },
  { id: "slot-2", day: "Monday", startHour: 13, duration: 1, classId: "class-dbms-a", room: "CR 210" },
  { id: "slot-3", day: "Tuesday", startHour: 9, duration: 1, classId: "class-dbms-b", room: "CR 118" },
  { id: "slot-4", day: "Tuesday", startHour: 14, duration: 2, classId: "class-dbms-lab-b", room: "Lab 3 · Block C" },
  { id: "slot-5", day: "Wednesday", startHour: 11, duration: 1, classId: "class-dbms-a", room: "CR 210" },
  { id: "slot-6", day: "Thursday", startHour: 10, duration: 1, classId: "class-dbms-b", room: "CR 118" },
  { id: "slot-7", day: "Thursday", startHour: 15, duration: 1, classId: "class-dbms-a", room: "CR 204" },
  { id: "slot-8", day: "Friday", startHour: 9, duration: 1, classId: "class-dbms-a", room: "CR 210" },
  { id: "slot-9", day: "Friday", startHour: 13, duration: 1, classId: "class-dbms-b", room: "CR 118" },
  { id: "slot-10", day: "Saturday", startHour: 10, duration: 2, classId: "class-dbms-lab-b", room: "Lab 3 · Block C" },
]

export const notifications = {
  student: [
    { id: "n1", title: "Attendance marked", body: "You were marked Present for DBMS · 10:00 AM.", time: "Today, 10:06 AM", unread: true },
    { id: "n2", title: "Attendance warning", body: "DAA is at 72.7%. Two more absences will keep you below 75%.", time: "Yesterday", unread: true },
    { id: "n3", title: "Lecture reminder", body: "Computer Networks lecture starts at 11:00 AM in CR 204.", time: "Mon", unread: false },
  ],
  teacher: [
    { id: "n1", title: "Session QR generated", body: "Dynamic QR is active for DBMS · CSE-B · Lab 3.", time: "Today, 10:01 AM", unread: true },
    { id: "n2", title: "Low attendance alert", body: "4 students in CSE-B DBMS are below 75%.", time: "Yesterday", unread: true },
    { id: "n3", title: "Lab scheduled", body: "DBMS Lab · CSE-B is on Saturday at 10:00 AM.", time: "Fri", unread: false },
  ],
  hod: [
    { id: "n1", title: "Department summary", body: "CSE attendance this week averaged 82%.", time: "Today", unread: true },
    { id: "n2", title: "Faculty update", body: "Prof. Mehta closed 2 attendance sessions yesterday.", time: "Yesterday", unread: false },
  ],
}
