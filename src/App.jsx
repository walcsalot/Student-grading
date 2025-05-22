import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./components/auth/login-form";
import StudentAttendance from "./components/student/AttendanceRecord";
import StudentDashboard from "./components/student/StudentDashboard";
import StudentGrades from "./components/student/StudentGradesPage";
import StudentProfile from "./components/student/StudentProfilePage";

import AttendanceManage from "./components/teacher/AttendancePage";
import GradesManage from "./components/teacher/GradesPage";
import Report from "./components/teacher/ReportsPage";
import StudentManage from "./components/teacher/StudentsPage";
import TeacherSubject from "./components/teacher/SubjectsPage";
import TeacherDashboard from "./components/teacher/TeacherDashboard";

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/attendance" element={<StudentAttendance />} />
          <Route path="/student/grades" element={<StudentGrades />} />
          <Route path="/student/profile" element={<StudentProfile />} />

          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/subjects" element={<TeacherSubject />} />
          <Route path="/teacher/students" element={<StudentManage />} />
          <Route path="/teacher/attendance" element={<AttendanceManage />} />
          <Route path="/teacher/grades" element={<GradesManage />} />
          <Route path="/teacher/reports" element={<Report />} />
        </Routes>
    </Router>
  );
}

export default App;
