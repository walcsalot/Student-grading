"use client"

import React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginForm from "./components/auth/login-form"
import StudentDashboard from "./components/student/StudentDashboard"
import AttendanceRecord from "./components/student/AttendanceRecord"
import StudentGradesPage from "./components/student/StudentGradesPage"
import StudentProfilePage from "./components/student/StudentProfilePage"

import TeacherDashboard from "./components/teacher/TeacherDashboard"
import AttendancePage from "./components/teacher/AttendancePage"
import GradesPage from "./components/teacher/GradesPage"
import SubjectsPage from "./components/teacher/SubjectsPage"
import StudentsPage from "./components/teacher/StudentsPage"
import ReportsPage from "./components/teacher/ReportsPage"

// Import Supabase client
import { supabase } from "./lib/supabaseClient"

// Auth guard component
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user || null)
      setLoading(false)
    }

    checkUser()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginForm />} />

        {/* Student routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute>
              <AttendanceRecord />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/grades"
          element={
            <ProtectedRoute>
              <StudentGradesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute>
              <StudentProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Add teacher routes here */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/subjects"
          element={
            <ProtectedRoute>
              <SubjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students"
          element={
            <ProtectedRoute>
              <StudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute>
              <AttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/grades"
          element={
            <ProtectedRoute>
              <GradesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
