"use client"

import { useEffect, useState } from "react"
import StudentLayout from "../layout/student-layout"
import { BookOpen, ClipboardCheck } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    subjects: 0,
    attendanceRecords: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get session and user
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()
        if (sessionError || !session) {
          window.location.href = "/"
          return
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError || !user) {
          window.location.href = "/"
          return
        }

        // Get student data using consistent identifier (email or user_id)
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id, subjects") // Make sure to select id for attendance query
          .eq("email", user.email) // Changed from email to user_id for consistency
          .single()

        if (studentError) throw studentError
        if (!studentData) {
          throw new Error("Student record not found")
        }

        // Count enrolled subjects (improved parsing without replace)
        let enrolledSubjects = 0
        if (studentData?.subjects) {
          if (typeof studentData.subjects === "string") {
            try {
              enrolledSubjects = JSON.parse(studentData.subjects).length
            } catch {
              enrolledSubjects = 1
            }
          } else if (Array.isArray(studentData.subjects)) {
            enrolledSubjects = studentData.subjects.length
          } else {
            enrolledSubjects = 1
          }
        }

        // Count attendance records using student's id from students table
        const { count: attendanceCount, error: attendanceError } = await supabase
          .from("attendance")
          .select("*", { count: "exact", head: true })
          .eq("student_id", studentData.id) // Use studentData.id instead of user.id

        if (attendanceError) throw attendanceError

        setStats({
          subjects: enrolledSubjects,
          attendanceRecords: attendanceCount || 0,
        })
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <StudentLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-600"></div>
        </div>
      </StudentLayout>
    )
  }

  if (error) {
    return (
      <StudentLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout title="Dashboard">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-700">Enrolled Subjects</h3>
              <BookOpen className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{stats.subjects}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-700">Attendance Records</h3>
              <ClipboardCheck className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{stats.attendanceRecords}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Quick Links</h3>
            </div>
            <div className="p-4 space-y-2">
              <a
                href="/student/attendance"
                className="block p-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
              >
                View Attendance
              </a>
              <a href="/student/grades" className="block p-2 text-sm rounded-lg hover:bg-gray-100 transition-colors">
                View Grades
              </a>
              <a href="/student/profile" className="block p-2 text-sm rounded-lg hover:bg-gray-100 transition-colors">
                Update Profile
              </a>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}
