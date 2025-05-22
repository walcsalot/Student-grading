"use client"

import { useState, useEffect } from "react"
import TeacherLayout from "../layout/teacher-layout"
import { Save } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"

export default function GradesPage() {
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [gradeRecords, setGradeRecords] = useState([])
  const [currentGrades, setCurrentGrades] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("raw")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: subjectsData } = await supabase.from("subjects").select("*")
      const { data: studentsData } = await supabase.from("students").select("*")
      const { data: gradesData } = await supabase.from("grades").select("*")

      if (subjectsData) setSubjects(subjectsData)
      if (studentsData) setStudents(studentsData)
      if (gradesData) setGradeRecords(gradesData)
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedSubject) {
      const fetchGrades = async () => {
        const { data } = await supabase.from("grades").select("*").eq("subject_id", selectedSubject)

        const existingRecords = data || []
        const gradesMap = {}

        // Filter students who are enrolled in this subject
        const studentsInSubject = students.filter((student) => student.subjects?.includes(selectedSubject))

        studentsInSubject.forEach((student) => {
          gradesMap[student.id] = {
            prelim: 0,
            midterm: 0,
            semifinal: 0,
            final: 0,
          }
        })

        existingRecords.forEach((record) => {
          if (!gradesMap[record.student_id]) {
            gradesMap[record.student_id] = {
              prelim: 0,
              midterm: 0,
              semifinal: 0,
              final: 0,
            }
          }
          gradesMap[record.student_id][record.term] = record.grade
        })

        setCurrentGrades(gradesMap)
      }

      fetchGrades()
    }
  }, [selectedSubject, gradeRecords, students])

  const handleGradeChange = (studentId, term, value) => {
    const numValue = Number.parseFloat(value) || 0
    setCurrentGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [term]: numValue,
      },
    }))
  }

  const saveGrades = async () => {
    if (!selectedSubject) return

    setIsSaving(true)

    // Prepare records to upsert
    const recordsToUpsert = Object.entries(currentGrades).flatMap(([studentId, terms]) => {
      return Object.entries(terms).map(([term, grade]) => ({
        subject_id: selectedSubject,
        student_id: studentId,
        term,
        grade,
      }))
    })

    const { error } = await supabase
      .from("grades")
      .upsert(recordsToUpsert, { onConflict: ["subject_id", "student_id", "term"] })

    if (!error) {
      // Refetch grades
      const { data } = await supabase.from("grades").select("*").eq("subject_id", selectedSubject)

      setGradeRecords(data || [])
    }

    setIsSaving(false)
  }

  const calculateCumulativeGrades = () => {
    const cumulativeGrades = {}

    // Filter students who are enrolled in this subject
    const studentsInSubject = students.filter((student) =>
      selectedSubject ? student.subjects?.includes(selectedSubject) : false,
    )

    studentsInSubject.forEach((student) => {
      const studentGrades = currentGrades[student.id] || {
        prelim: 0,
        midterm: 0,
        semifinal: 0,
        final: 0,
      }

      const prelimGrade = studentGrades.prelim
      const midtermGrade = (prelimGrade + studentGrades.midterm) / 2
      const semifinalGrade = (midtermGrade + studentGrades.semifinal) / 2
      const finalGrade = (semifinalGrade + studentGrades.final) / 2

      cumulativeGrades[student.id] = {
        prelim: prelimGrade,
        midterm: midtermGrade,
        semifinal: semifinalGrade,
        final: finalGrade,
      }
    })

    return cumulativeGrades
  }

  const cumulativeGrades = calculateCumulativeGrades()
  const isPassingGrade = (grade) => grade <= 3.0

  // Get students enrolled in the selected subject
  const studentsInSubject = students.filter((student) =>
    selectedSubject ? student.subjects?.includes(selectedSubject) : false,
  )

  return (
    <TeacherLayout title="Grades">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Manage Grades</h2>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Select Subject</h3>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <select
                  id="subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {selectedSubject && (
          <div>
            <div className="mb-4">
              <div className="flex border-b border-gray-200">
                <button
                  className={`py-2 px-4 ${
                    activeTab === "raw" ? "border-b-2 border-gray-700 font-medium" : "text-gray-500"
                  }`}
                  onClick={() => setActiveTab("raw")}
                >
                  Raw Grades
                </button>
                <button
                  className={`py-2 px-4 ${
                    activeTab === "cumulative" ? "border-b-2 border-gray-700 font-medium" : "text-gray-500"
                  }`}
                  onClick={() => setActiveTab("cumulative")}
                >
                  Cumulative Grades
                </button>
              </div>
            </div>

            {activeTab === "raw" && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800">Raw Grades</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {subjects.find((s) => s.id === selectedSubject)?.name}
                    <span className="ml-2 text-gray-600">({studentsInSubject.length} students)</span>
                  </p>
                </div>
                <div className="p-4">
                  {loading ? (
                    <p className="text-center py-4 text-gray-500">Loading grades data...</p>
                  ) : studentsInSubject.length === 0 ? (
                    <p className="text-center py-4 text-gray-500">
                      No students enrolled in this subject. Add students to the subject first.
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left p-2 text-gray-700">Student</th>
                              <th className="text-left p-2 text-gray-700">Prelim</th>
                              <th className="text-left p-2 text-gray-700">Midterm</th>
                              <th className="text-left p-2 text-gray-700">Semi-Final</th>
                              <th className="text-left p-2 text-gray-700">Final</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentsInSubject.map((student) => (
                              <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-2 flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                                    {student.photo ? (
                                      <img
                                        src={student.photo || "/placeholder.svg"}
                                        alt={student.full_name}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-gray-600 font-medium">
                                        {student.full_name
                                          ?.split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </span>
                                    )}
                                  </div>
                                  <span>{student.full_name}</span>
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    step="0.1"
                                    value={currentGrades[student.id]?.prelim || ""}
                                    onChange={(e) => handleGradeChange(student.id, "prelim", e.target.value)}
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    step="0.1"
                                    value={currentGrades[student.id]?.midterm || ""}
                                    onChange={(e) => handleGradeChange(student.id, "midterm", e.target.value)}
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    step="0.1"
                                    value={currentGrades[student.id]?.semifinal || ""}
                                    onChange={(e) => handleGradeChange(student.id, "semifinal", e.target.value)}
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    step="0.1"
                                    value={currentGrades[student.id]?.final || ""}
                                    onChange={(e) => handleGradeChange(student.id, "final", e.target.value)}
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                          onClick={saveGrades}
                          disabled={isSaving}
                        >
                          {isSaving ? "Saving..." : "Save Grades"}
                          <Save className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "cumulative" && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800">Cumulative Grades</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {subjects.find((s) => s.id === selectedSubject)?.name}
                    <span className="ml-2 text-gray-600">({studentsInSubject.length} students)</span>
                  </p>
                </div>
                <div className="p-4">
                  {loading ? (
                    <p className="text-center py-4 text-gray-500">Loading cumulative grades...</p>
                  ) : studentsInSubject.length === 0 ? (
                    <p className="text-center py-4 text-gray-500">
                      No students enrolled in this subject. Add students to the subject first.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left p-2 text-gray-700">Student</th>
                            <th className="text-left p-2 text-gray-700">Prelim</th>
                            <th className="text-left p-2 text-gray-700">Midterm</th>
                            <th className="text-left p-2 text-gray-700">Semi-Final</th>
                            <th className="text-left p-2 text-gray-700">Final</th>
                            <th className="text-left p-2 text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentsInSubject.map((student) => {
                            const studentCumulativeGrades = cumulativeGrades[student.id] || {
                              prelim: 0,
                              midterm: 0,
                              semifinal: 0,
                              final: 0,
                            }
                            const finalGrade = studentCumulativeGrades.final
                            const isPassing = isPassingGrade(finalGrade)

                            return (
                              <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-2 flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                                    {student.photo ? (
                                      <img
                                        src={student.photo || "/placeholder.svg"}
                                        alt={student.full_name}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-gray-600 font-medium">
                                        {student.full_name
                                          ?.split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </span>
                                    )}
                                  </div>
                                  <span>{student.full_name}</span>
                                </td>
                                <td
                                  className={`p-2 ${
                                    !isPassingGrade(studentCumulativeGrades.prelim) ? "text-red-500 font-medium" : ""
                                  }`}
                                >
                                  {studentCumulativeGrades.prelim.toFixed(2)}
                                </td>
                                <td
                                  className={`p-2 ${
                                    !isPassingGrade(studentCumulativeGrades.midterm) ? "text-red-500 font-medium" : ""
                                  }`}
                                >
                                  {studentCumulativeGrades.midterm.toFixed(2)}
                                </td>
                                <td
                                  className={`p-2 ${
                                    !isPassingGrade(studentCumulativeGrades.semifinal) ? "text-red-500 font-medium" : ""
                                  }`}
                                >
                                  {studentCumulativeGrades.semifinal.toFixed(2)}
                                </td>
                                <td className={`p-2 ${!isPassingGrade(finalGrade) ? "text-red-500 font-medium" : ""}`}>
                                  {finalGrade.toFixed(2)}
                                </td>
                                <td
                                  className={`p-2 ${
                                    isPassing ? "text-green-500 font-medium" : "text-red-500 font-medium"
                                  }`}
                                >
                                  {isPassing ? "Passed" : "Failed"}
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
        )}
      </div>
    </TeacherLayout>
  )
}
