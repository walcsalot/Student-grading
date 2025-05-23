"use client"

import { useState, useEffect } from "react"
import TeacherLayout from "../layout/teacher-layout"
import { FileDown } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"

export default function ReportsPage() {
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [gradeRecords, setGradeRecords] = useState([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [activeTab, setActiveTab] = useState("attendance")
  // Removed unused loading state

  useEffect(() => {
    const fetchData = async () => {
      // Removed setLoading call
      const { data: subjectsData } = await supabase.from("subjects").select("*")
      const { data: studentsData } = await supabase.from("students").select("*")
      const { data: attendanceData } = await supabase.from("attendance").select("*")
      const { data: gradesData } = await supabase.from("grades").select("*")

      if (subjectsData) setSubjects(subjectsData)
      if (studentsData) setStudents(studentsData)
      if (attendanceData) setAttendanceRecords(attendanceData)
      if (gradesData) setGradeRecords(gradesData)
      // Removed setLoading call
    }
    fetchData()
  }, [])

  const calculateCumulativeGrades = (studentId) => {
    const studentGrades = gradeRecords
      .filter((record) => record.subject_id === selectedSubject && record.student_id === studentId)
      .reduce(
        (acc, record) => {
          acc[record.term] = record.grade
          return acc
        },
        { prelim: 0, midterm: 0, semifinal: 0, final: 0 },
      )

    const prelimGrade = studentGrades.prelim
    const midtermGrade = (prelimGrade + studentGrades.midterm) / 2
    const semifinalGrade = (midtermGrade + studentGrades.semifinal) / 2
    const finalGrade = (semifinalGrade + studentGrades.final) / 2

    return {
      raw: studentGrades,
      cumulative: {
        prelim: prelimGrade,
        midterm: midtermGrade,
        semifinal: semifinalGrade,
        final: finalGrade,
      },
    }
  }

  const exportAttendanceCSV = () => {
    if (!selectedSubject) return

    const subject = subjects.find((s) => s.id === selectedSubject)
    if (!subject) return

    const relevantAttendance = attendanceRecords.filter((record) => record.subject_id === selectedSubject)
    const attendanceByDate = relevantAttendance.reduce((acc, record) => {
      if (!acc[record.date]) {
        acc[record.date] = {}
      }
      acc[record.date][record.student_id] = record.status
      return acc
    }, {})

    let csv = "Student ID,Student Name"
    const dates = Object.keys(attendanceByDate).sort()
    dates.forEach((date) => {
      csv += `,${date}`
    })
    csv += "\n"

    students.forEach((student) => {
      csv += `${student.student_id},"${student.full_name}"`
      dates.forEach((date) => {
        const status = attendanceByDate[date][student.id] || "N/A"
        csv += `,${status}`
      })
      csv += "\n"
    })

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${subject.code}_attendance.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportGradesCSV = () => {
    if (!selectedSubject) return

    const subject = subjects.find((s) => s.id === selectedSubject)
    if (!subject) return

    let csv =
      "Student ID,Student Name,Prelim Raw,Midterm Raw,Semi-Final Raw,Final Raw,Prelim Cumulative,Midterm Cumulative,Semi-Final Cumulative,Final Cumulative,Status\n"

    students.forEach((student) => {
      const grades = calculateCumulativeGrades(student.id)
      const finalGrade = grades.cumulative.final
      const status = finalGrade <= 3.0 ? "Passed" : "Failed"

      csv += `${student.student_id},"${student.full_name}",`
      csv += `${grades.raw.prelim},${grades.raw.midterm},${grades.raw.semifinal},${grades.raw.final},`
      csv += `${grades.cumulative.prelim.toFixed(2)},${grades.cumulative.midterm.toFixed(2)},${grades.cumulative.semifinal.toFixed(2)},${grades.cumulative.final.toFixed(2)},`
      csv += `${status}\n`
    })

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${subject.code}_grades.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportAttendancePDF = () => {
    if (!selectedSubject) return

    const subject = subjects.find((s) => s.id === selectedSubject)
    if (!subject) return

    // Create HTML content for PDF
    const relevantAttendance = attendanceRecords.filter((record) => record.subject_id === selectedSubject)
    const attendanceByDate = relevantAttendance.reduce((acc, record) => {
      if (!acc[record.date]) {
        acc[record.date] = {}
      }
      acc[record.date][record.student_id] = record.status
      return acc
    }, {})

    const dates = Object.keys(attendanceByDate).sort()
    const enrolledStudents = students.filter((student) => student.subjects?.includes(selectedSubject))

    const htmlContent = `
      <html>
        <head>
          <title>Attendance Report - ${subject.code}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .subject-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .present { background-color: #d4edda; }
            .absent { background-color: #f8d7da; }
            .late { background-color: #fff3cd; }
            .excused { background-color: #d1ecf1; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Attendance Report</h1>
            <h2>${subject.code} - ${subject.name}</h2>
          </div>
          
          <div class="subject-info">
            <strong>Subject:</strong> ${subject.name} (${subject.code})<br>
            <strong>Semester:</strong> ${subject.semester}<br>
            <strong>School Year:</strong> ${subject.school_year}<br>
            <strong>Total Students:</strong> ${enrolledStudents.length}<br>
            <strong>Report Generated:</strong> ${new Date().toLocaleDateString()}
          </div>
  
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                ${dates.map((date) => `<th>${new Date(date).toLocaleDateString()}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${enrolledStudents
                .map(
                  (student) => `
                <tr>
                  <td>${student.student_id}</td>
                  <td>${student.full_name}</td>
                  ${dates
                    .map((date) => {
                      const status = attendanceByDate[date][student.id] || "N/A"
                      return `<td class="${status.toLowerCase()}">${status}</td>`
                    })
                    .join("")}
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
  
          <div class="footer">
            <p>Generated by Student Management System on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `

    // Create a new window and print
    const printWindow = window.open("", "_blank")
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  const exportGradesPDF = () => {
    if (!selectedSubject) return

    const subject = subjects.find((s) => s.id === selectedSubject)
    if (!subject) return

    const enrolledStudents = students.filter((student) => student.subjects?.includes(selectedSubject))

    const htmlContent = `
      <html>
        <head>
          <title>Grade Report - ${subject.code}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .subject-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 11px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .student-name { text-align: left; }
            .passed { background-color: #d4edda; color: #155724; font-weight: bold; }
            .failed { background-color: #f8d7da; color: #721c24; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Grade Report</h1>
            <h2>${subject.code} - ${subject.name}</h2>
          </div>
          
          <div class="subject-info">
            <strong>Subject:</strong> ${subject.name} (${subject.code})<br>
            <strong>Semester:</strong> ${subject.semester}<br>
            <strong>School Year:</strong> ${subject.school_year}<br>
            <strong>Total Students:</strong> ${enrolledStudents.length}<br>
            <strong>Report Generated:</strong> ${new Date().toLocaleDateString()}
          </div>
  
          <table>
            <thead>
              <tr>
                <th rowspan="2">Student ID</th>
                <th rowspan="2">Student Name</th>
                <th colspan="4">Raw Grades</th>
                <th colspan="4">Cumulative Grades</th>
                <th rowspan="2">Status</th>
              </tr>
              <tr>
                <th>Prelim</th>
                <th>Midterm</th>
                <th>Semi-Final</th>
                <th>Final</th>
                <th>Prelim</th>
                <th>Midterm</th>
                <th>Semi-Final</th>
                <th>Final</th>
              </tr>
            </thead>
            <tbody>
              ${enrolledStudents
                .map((student) => {
                  const grades = calculateCumulativeGrades(student.id)
                  const finalGrade = grades.cumulative.final
                  const status = finalGrade <= 3.0 ? "Passed" : "Failed"

                  return `
                  <tr>
                    <td>${student.student_id}</td>
                    <td class="student-name">${student.full_name}</td>
                    <td>${grades.raw.prelim || "-"}</td>
                    <td>${grades.raw.midterm || "-"}</td>
                    <td>${grades.raw.semifinal || "-"}</td>
                    <td>${grades.raw.final || "-"}</td>
                    <td>${grades.cumulative.prelim.toFixed(2)}</td>
                    <td>${grades.cumulative.midterm.toFixed(2)}</td>
                    <td>${grades.cumulative.semifinal.toFixed(2)}</td>
                    <td>${grades.cumulative.final.toFixed(2)}</td>
                    <td class="${status.toLowerCase()}">${status}</td>
                  </tr>
                `
                })
                .join("")}
            </tbody>
          </table>
  
          <div class="footer">
            <p>Generated by Student Management System on ${new Date().toLocaleString()}</p>
            <p>Grading Scale: 1.0-3.0 = Passed, 3.1-5.0 = Failed</p>
          </div>
        </body>
      </html>
    `

    // Create a new window and print
    const printWindow = window.open("", "_blank")
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  return (
    <TeacherLayout title="Reports">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Generate Reports</h2>
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
                    activeTab === "attendance" ? "border-b-2 border-gray-700 font-medium" : "text-gray-500"
                  }`}
                  onClick={() => setActiveTab("attendance")}
                >
                  Attendance Reports
                </button>
                <button
                  className={`py-2 px-4 ${
                    activeTab === "grades" ? "border-b-2 border-gray-700 font-medium" : "text-gray-500"
                  }`}
                  onClick={() => setActiveTab("grades")}
                >
                  Grade Reports
                </button>
              </div>
            </div>

            {activeTab === "attendance" && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800">Attendance Reports</h3>
                </div>
                <div className="p-4">
                  <p className="mb-4 text-gray-500">
                    Export attendance records for the selected subject. The report includes attendance status (Present,
                    Absent, Late, Excused) for each student.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800"
                      onClick={exportAttendanceCSV}
                    >
                      <FileDown className="h-4 w-4" />
                      Export as CSV
                    </button>
                    <button
                      className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                      onClick={exportAttendancePDF}
                    >
                      <FileDown className="h-4 w-4" />
                      Export as PDF
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "grades" && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800">Grade Reports</h3>
                </div>
                <div className="p-4">
                  <p className="mb-4 text-gray-500">
                    Export grade records for the selected subject. The report includes both raw and cumulative grades
                    for each term, as well as the final status (Passed/Failed).
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800"
                      onClick={exportGradesCSV}
                    >
                      <FileDown className="h-4 w-4" />
                      Export as CSV
                    </button>
                    <button
                      className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                      onClick={exportGradesPDF}
                    >
                      <FileDown className="h-4 w-4" />
                      Export as PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </TeacherLayout>
  )
}
