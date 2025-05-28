import { useEffect, useState } from "react"
import StudentLayout from "../layout/student-layout"
import { BookOpen, ClipboardCheck, User, Calendar, TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    subjects: 0,
    attendanceRecords: 0,
  })
  const [recentAttendance, setRecentAttendance] = useState([])
  const [gradeStatus, setGradeStatus] = useState([])
  const [studentProfile, setStudentProfile] = useState(null)
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

        // Get student data
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id, subjects, full_name, photo, student_id")
          .eq("email", user.email)
          .single()

        if (studentError) throw studentError
        if (!studentData) {
          throw new Error("Student record not found")
        }

        setStudentProfile({
          fullName: studentData.full_name,
          photo: studentData.photo,
          studentId: studentData.student_id,
          email: user.email,
        })

        // Parse enrolled subjects
        let enrolledSubjectIds = []
        if (studentData?.subjects) {
          if (typeof studentData.subjects === "string") {
            try {
              enrolledSubjectIds = JSON.parse(studentData.subjects)
            } catch {
              enrolledSubjectIds = [studentData.subjects]
            }
          } else if (Array.isArray(studentData.subjects)) {
            enrolledSubjectIds = studentData.subjects
          } else {
            enrolledSubjectIds = [studentData.subjects]
          }
        }

        // Get subjects data
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("*")
          .in("id", enrolledSubjectIds)

        if (subjectsError) throw subjectsError

        // Count attendance records
        const { count: attendanceCount, error: attendanceError } = await supabase
          .from("attendance")
          .select("*", { count: "exact", head: true })
          .eq("student_id", studentData.id)

        if (attendanceError) throw attendanceError

        // Get recent attendance (last 5 records)
        const { data: recentAttendanceData, error: recentAttendanceError } = await supabase
          .from("attendance")
          .select("*, subjects(code, name)")
          .eq("student_id", studentData.id)
          .order("date", { ascending: false })
          .limit(5)

        if (recentAttendanceError) throw recentAttendanceError

        // Get grades for status overview
        const { data: gradesData, error: gradesError } = await supabase
          .from("grades")
          .select("*, subjects(code, name)")
          .eq("student_id", studentData.id)
          .in("subject_id", enrolledSubjectIds)

        if (gradesError) throw gradesError

        // Process grade status by subject with cumulative calculation
        const gradesBySubject = {}
        gradesData?.forEach((grade) => {
          if (!gradesBySubject[grade.subject_id]) {
            gradesBySubject[grade.subject_id] = {
              subject: grade.subjects,
              prelim: 0,
              midterm: 0,
              semifinal: 0,
              final: 0,
            }
          }
          gradesBySubject[grade.subject_id][grade.term] = grade.grade
        })

        // Calculate cumulative grades like in the grades page
        const calculateCumulativeGrades = (rawGrades) => {
          const prelimGrade = rawGrades.prelim || 0
          const midtermGrade = (prelimGrade + (rawGrades.midterm || 0)) / 2
          const semifinalGrade = (midtermGrade + (rawGrades.semifinal || 0)) / 2
          const finalGrade = (semifinalGrade + (rawGrades.final || 0)) / 2

          return {
            prelim: prelimGrade,
            midterm: midtermGrade,
            semifinal: semifinalGrade,
            final: finalGrade,
          }
        }

        const isPassingGrade = (grade) => grade > 0 && grade <= 3.0

        const gradeStatusArray = Object.values(gradesBySubject).map((subjectGrades) => {
          const cumulativeGrades = calculateCumulativeGrades(subjectGrades)
          const finalCumulativeGrade = cumulativeGrades.final
          const hasFinalGrade = finalCumulativeGrade > 0
          const isPassing = hasFinalGrade && isPassingGrade(finalCumulativeGrade)

          return {
            subject: subjectGrades.subject,
            status: hasFinalGrade ? (isPassing ? "passed" : "failed") : "pending",
            finalGrade: hasFinalGrade ? finalCumulativeGrade : null,
            rawGrades: subjectGrades,
            cumulativeGrades: cumulativeGrades,
          }
        })

        setStats({
          subjects: enrolledSubjectIds.length,
          attendanceRecords: attendanceCount || 0,
        })
        setRecentAttendance(recentAttendanceData || [])
        setGradeStatus(gradeStatusArray)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getAttendanceIcon = (status) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "absent":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "late":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "excused":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status, grade = null) => {
    switch (status) {
      case "passed":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Passed</span>
      case "failed":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Failed</span>
      case "pending":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Unknown</span>
    }
  }

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
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
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

        {/* Profile Preview - Full Width */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-bold text-gray-800">My Profile</h3>
            </div>
          </div>
          <div className="p-6">
            {studentProfile ? (
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center border-4 border-gray-300">
                  {studentProfile.photo ? (
                    <img
                      src={studentProfile.photo || "/placeholder.svg"}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none"
                        e.target.nextSibling.style.display = "flex"
                      }}
                    />
                  ) : null}
                  <span className={`text-gray-500 font-medium text-2xl ${studentProfile.photo ? "hidden" : "flex"}`}>
                    {studentProfile.fullName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "ST"}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900 mb-1">{studentProfile.fullName}</h4>
                  <p className="text-sm text-gray-600 mb-1">Student ID: {studentProfile.studentId}</p>
                  <p className="text-sm text-gray-600 mb-4">{studentProfile.email}</p>
                  <a
                    href="/student/profile"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Edit Profile
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Loading profile...</p>
            )}
          </div>
        </div>

        {/* Attendance and Grade Previews - Side by Side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Attendance Preview */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-bold text-gray-800">Recent Attendance</h3>
              </div>
            </div>
            <div className="p-4">
              {recentAttendance.length > 0 ? (
                <div className="space-y-3">
                  {recentAttendance.slice(0, 4).map((record) => (
                    <div key={record.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getAttendanceIcon(record.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{record.subjects?.code || "Unknown"}</p>
                          <p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="text-xs capitalize text-gray-600">{record.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No attendance records yet</p>
              )}
              <div className="mt-4">
                <a href="/student/attendance" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View All Attendance →
                </a>
              </div>
            </div>
          </div>

          {/* Grade Status Preview */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-bold text-gray-800">Grade Status</h3>
              </div>
            </div>
            <div className="p-4">
              {gradeStatus.length > 0 ? (
                <div className="space-y-3">
                  {gradeStatus.slice(0, 4).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.subject?.code || "Unknown"}</p>
                        <p className="text-xs text-gray-500">
                          {item.finalGrade ? `Cumulative: ${item.finalGrade.toFixed(2)}` : "No grades yet"}
                        </p>
                      </div>
                      {getStatusBadge(item.status, item.finalGrade)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No grade records yet</p>
              )}
              <div className="mt-4">
                <a href="/student/grades" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View All Grades →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}
