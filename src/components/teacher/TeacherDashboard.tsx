import { useEffect, useState } from "react"
import TeacherLayout from "../layout/teacher-layout"
import { BookOpen, Users, User } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    subjects: 0,
    students: 0,
    attendanceRecords: 0,
    gradeRecords: 0,
  })
  const [recentSubjects, setRecentSubjects] = useState([])
  const [recentStudents, setRecentStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)

      // Fetch counts
      const { count: subjectsCount } = await supabase.from("subjects").select("*", { count: "exact", head: true })
      const { count: studentsCount } = await supabase.from("students").select("*", { count: "exact", head: true })
      const { count: attendanceCount } = await supabase.from("attendance").select("*", { count: "exact", head: true })
      const { count: gradesCount } = await supabase.from("grades").select("*", { count: "exact", head: true })

      // Fetch 3 newest subjects
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3)

      // Fetch 3 newest students
      const { data: studentsData } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3)

      setStats({
        subjects: subjectsCount || 0,
        students: studentsCount || 0,
        attendanceRecords: attendanceCount || 0,
        gradeRecords: gradesCount || 0,
      })

      setRecentSubjects(subjectsData || [])
      setRecentStudents(studentsData || [])
      setLoading(false)
    }

    fetchStats()
  }, [])

  return (
    <TeacherLayout title="Dashboard">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-700">Total Subjects</h3>
              <BookOpen className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{loading ? "--" : stats.subjects}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-gray-700">Total Students</h3>
              <Users className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{loading ? "--" : stats.students}</div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Subjects Preview */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Recent Subjects</h3>
                <a href="/teacher/subjects" className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  View All
                </a>
              </div>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentSubjects.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No subjects found</p>
              ) : (
                <div className="space-y-3">
                  {recentSubjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {subject.code} - {subject.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {subject.semester} • {subject.school_year}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Students Preview */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Recent Students</h3>
                <a href="/teacher/students" className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  View All
                </a>
              </div>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentStudents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No students found</p>
              ) : (
                <div className="space-y-3">
                  {recentStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                        {student.photo ? (
                          <img
                            src={student.photo || "/placeholder.svg"}
                            alt={student.full_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{student.full_name}</p>
                        <p className="text-xs text-gray-500">ID: {student.student_id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  )
}
