import { useState, useEffect } from "react"
import StudentLayout from "../layout/student-layout"
import { supabase } from "../../lib/supabaseClient"

export default function StudentGradesPage() {
  const [subjects, setSubjects] = useState([])
  const [grades, setGrades] = useState([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [activeTab, setActiveTab] = useState("raw")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Get authenticated user session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()
        if (sessionError || !session) {
          window.location.href = "/"
          return
        }

        // 2. Get user details
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError || !user) {
          window.location.href = "/"
          return
        }

        // 3. Get student record using email (consistent with other pages)
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id, subjects")
          .eq("email", user.email)
          .single()

        if (studentError) throw studentError
        if (!studentData) {
          throw new Error("Student record not found")
        }

        // 4. Get enrolled subjects (with proper error handling)
        let enrolledSubjectIds = []
        if (studentData.subjects) {
          try {
            enrolledSubjectIds = Array.isArray(studentData.subjects)
              ? studentData.subjects
              : JSON.parse(studentData.subjects)
          } catch (e) {
            console.error("Error parsing subjects:", e)
            throw new Error("Failed to parse enrolled subjects")
          }
        }

        // 5. Get subjects data (only enrolled subjects)
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("*")
          .in("id", enrolledSubjectIds)

        if (subjectsError) throw subjectsError
        setSubjects(subjectsData || [])

        // 6. Get grades (only for this student and enrolled subjects)
        const { data: gradesData, error: gradesError } = await supabase
          .from("grades")
          .select("*")
          .eq("student_id", studentData.id)
          .in("subject_id", enrolledSubjectIds)

        if (gradesError) throw gradesError
        setGrades(gradesData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error.message || "Failed to load grade data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getGradesBySubject = () => {
    if (!grades.length) return {}

    const filteredGrades = selectedSubject ? grades.filter((grade) => grade.subject_id === selectedSubject) : grades

    const groupedGrades = {}

    filteredGrades.forEach((grade) => {
      if (!groupedGrades[grade.subject_id]) {
        groupedGrades[grade.subject_id] = {
          prelim: 0,
          midterm: 0,
          semifinal: 0,
          final: 0,
        }
      }
      groupedGrades[grade.subject_id][grade.term] = grade.grade
    })

    return groupedGrades
  }

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

  const gradesBySubject = getGradesBySubject()
  const enrolledSubjects = subjects

  if (loading) {
    return (
      <StudentLayout title="Grades">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-600"></div>
        </div>
      </StudentLayout>
    )
  }

  if (error) {
    return (
      <StudentLayout title="Grades">
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
    <StudentLayout title="Grades">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">My Grades</h2>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Filter by Subject</h3>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <select
                  id="subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
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

        <div className="mb-4">
          <div className="flex border-b border-gray-200">
            <button
              className={`py-2 px-4 ${
                activeTab === "raw" ? "border-b-2 border-gray-700 font-medium text-gray-800" : "text-gray-600"
              }`}
              onClick={() => setActiveTab("raw")}
            >
              Raw Grades
            </button>
            <button
              className={`py-2 px-4 ${
                activeTab === "cumulative" ? "border-b-2 border-gray-700 font-medium text-gray-800" : "text-gray-600"
              }`}
              onClick={() => setActiveTab("cumulative")}
            >
              Cumulative Grades
            </button>
          </div>
        </div>

        {activeTab === "raw" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Raw Grades</h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedSubject ? subjects.find((s) => s.id === selectedSubject)?.name : "All Subjects"}
                <span className="ml-2 text-gray-600">({Object.keys(gradesBySubject).length} subjects)</span>
              </p>
            </div>
            <div className="p-4">
              {Object.keys(gradesBySubject).length === 0 ? (
                <p className="text-center py-4 text-gray-500">No grade records found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="text-left p-3">Subject</th>
                        <th className="text-left p-3">Prelim</th>
                        <th className="text-left p-3">Midterm</th>
                        <th className="text-left p-3">Semi-Final</th>
                        <th className="text-left p-3">Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(gradesBySubject).map(([subjectId, terms]) => {
                        const subject = subjects.find((s) => s.id === subjectId)
                        return (
                          <tr key={subjectId} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-3">{subject ? `${subject.code} - ${subject.name}` : "Unknown"}</td>
                            <td
                              className={`p-3 ${
                                !isPassingGrade(terms.prelim) ? "text-red-600 font-medium" : "text-green-600"
                              }`}
                            >
                              {terms.prelim > 0 ? terms.prelim.toFixed(2) : "-"}
                            </td>
                            <td
                              className={`p-3 ${
                                !isPassingGrade(terms.midterm) ? "text-red-600 font-medium" : "text-green-600"
                              }`}
                            >
                              {terms.midterm > 0 ? terms.midterm.toFixed(2) : "-"}
                            </td>
                            <td
                              className={`p-3 ${
                                !isPassingGrade(terms.semifinal) ? "text-red-600 font-medium" : "text-green-600"
                              }`}
                            >
                              {terms.semifinal > 0 ? terms.semifinal.toFixed(2) : "-"}
                            </td>
                            <td
                              className={`p-3 ${
                                !isPassingGrade(terms.final) ? "text-red-600 font-medium" : "text-green-600"
                              }`}
                            >
                              {terms.final > 0 ? terms.final.toFixed(2) : "-"}
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
        )}

        {activeTab === "cumulative" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Cumulative Grades</h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedSubject ? subjects.find((s) => s.id === selectedSubject)?.name : "All Subjects"}
                <span className="ml-2 text-gray-600">({Object.keys(gradesBySubject).length} subjects)</span>
              </p>
            </div>
            <div className="p-4">
              {Object.keys(gradesBySubject).length === 0 ? (
                <p className="text-center py-4 text-gray-500">No grade records found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="text-left p-3">Subject</th>
                        <th className="text-left p-3">Prelim</th>
                        <th className="text-left p-3">Midterm</th>
                        <th className="text-left p-3">Semi-Final</th>
                        <th className="text-left p-3">Final</th>
                        <th className="text-left p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(gradesBySubject).map(([subjectId, rawGrades]) => {
                        const subject = subjects.find((s) => s.id === subjectId)
                        const cumulativeGrades = calculateCumulativeGrades(rawGrades)
                        const finalGrade = cumulativeGrades.final
                        const isPassing = isPassingGrade(finalGrade)

                        return (
                          <tr key={subjectId} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-3">{subject ? `${subject.code} - ${subject.name}` : "Unknown"}</td>
                            <td
                              className={`p-3 ${
                                !isPassingGrade(cumulativeGrades.prelim) ? "text-red-600 font-medium" : "text-green-600"
                              }`}
                            >
                              {cumulativeGrades.prelim > 0 ? cumulativeGrades.prelim.toFixed(2) : "-"}
                            </td>
                            <td
                              className={`p-3 ${
                                !isPassingGrade(cumulativeGrades.midterm)
                                  ? "text-red-600 font-medium"
                                  : "text-green-600"
                              }`}
                            >
                              {cumulativeGrades.midterm > 0 ? cumulativeGrades.midterm.toFixed(2) : "-"}
                            </td>
                            <td
                              className={`p-3 ${
                                !isPassingGrade(cumulativeGrades.semifinal)
                                  ? "text-red-600 font-medium"
                                  : "text-green-600"
                              }`}
                            >
                              {cumulativeGrades.semifinal > 0 ? cumulativeGrades.semifinal.toFixed(2) : "-"}
                            </td>
                            <td className={`p-3 ${!isPassing ? "text-red-600 font-medium" : "text-green-600"}`}>
                              {finalGrade > 0 ? finalGrade.toFixed(2) : "-"}
                            </td>
                            <td className="p-3">
                              <span
                                className={`${
                                  isPassing ? "bg-green-500" : "bg-red-500"
                                } text-white text-xs px-2 py-1 rounded-full`}
                              >
                                {finalGrade > 0 ? (isPassing ? "Passed" : "Failed") : "Pending"}
                              </span>
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
        )}
      </div>
    </StudentLayout>
  )
}
