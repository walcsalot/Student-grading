import { useState, useEffect } from "react"
import StudentLayout from "../layout/student-layout"
import { Check, X, Clock, AlertCircle } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"

export default function StudentAttendancePage() {
  const [subjects, setSubjects] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [currentUser, setCurrentUser] = useState(null)
  const [filteredAttendance, setFilteredAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrolledSubjects, setEnrolledSubjects] = useState([])

  // Status indicators configuration - matching AttendancePage.jsx
  const statusConfig = {
    present: {
      icon: <Check className="h-4 w-4 text-green-500" />,
      color: "bg-green-100 text-green-800",
      label: "Present",
    },
    absent: {
      icon: <X className="h-4 w-4 text-red-500" />,
      color: "bg-red-100 text-red-800",
      label: "Absent",
    },
    late: {
      icon: <Clock className="h-4 w-4 text-yellow-500" />,
      color: "bg-yellow-100 text-yellow-800",
      label: "Late",
    },
    excused: {
      icon: <AlertCircle className="h-4 w-4 text-blue-500" />,
      color: "bg-blue-100 text-blue-800",
      label: "Excused",
    },
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
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

        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("*")
          .eq("email", user.email)
          .single()

        if (studentError) throw studentError
        if (!studentData) {
          console.error("No student data found")
          return
        }

        setCurrentUser(studentData)

        let enrolledSubjectIds = []
        if (studentData?.subjects) {
          try {
            enrolledSubjectIds = Array.isArray(studentData.subjects)
              ? studentData.subjects
              : JSON.parse(studentData.subjects)
          } catch (error) {
            console.error("Error parsing subjects:", error)
            enrolledSubjectIds = []
          }
        }

        const { data: subjectsData } = await supabase.from("subjects").select("*").in("id", enrolledSubjectIds)

        setSubjects(subjectsData || [])
        setEnrolledSubjects(subjectsData || [])

        const { data: attendanceData } = await supabase
          .from("attendance")
          .select("*")
          .eq("student_id", studentData.id)
          .in("subject_id", enrolledSubjectIds)

        setAttendanceRecords(attendanceData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (currentUser && selectedSubject) {
      const filtered = attendanceRecords.filter((record) => record.subject_id === selectedSubject)
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setFilteredAttendance(filtered)
    } else if (currentUser) {
      setFilteredAttendance(attendanceRecords)
    }
  }, [currentUser, selectedSubject, attendanceRecords])

  // Updated status badge to match AttendancePage.jsx style
  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.absent
    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.color}`}>
        {config.icon}
        <span className="text-sm">{config.label}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <StudentLayout title="Attendance">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-600"></div>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout title="Attendance">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">My Attendance</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Filter by Subject</h3>
            </div>
            <div className="p-4 bg-white">
              <div className="space-y-2">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <select
                  id="subject"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                >
                  <option value="">All subjects</option>
                  {enrolledSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800">Attendance Records</h3>
            {/* Added status legend like in AttendancePage.jsx */}
            <div className="flex flex-wrap gap-4 mt-2">
              {Object.entries(statusConfig).map(([status, config]) => (
                <div key={status} className="flex items-center gap-1 text-sm">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      status === "present"
                        ? "bg-green-500"
                        : status === "absent"
                          ? "bg-red-500"
                          : status === "late"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                    }`}
                  ></div>
                  <span>{config.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-white">
            {filteredAttendance.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No attendance records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAttendance.map((record) => {
                      const subject = subjects.find((s) => s.id === record.subject_id)
                      return (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subject ? `${subject.code} - ${subject.name}` : "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getStatusBadge(record.status)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}
