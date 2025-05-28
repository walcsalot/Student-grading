import { useState, useEffect } from "react"
import TeacherLayout from "../layout/teacher-layout"
import { CalendarIcon, Save, Check, X, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { supabase } from "../../lib/supabaseClient"

export default function AttendancePage() {
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [currentAttendance, setCurrentAttendance] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Status indicators configuration
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
      setLoading(true)
      const { data: subjectsData } = await supabase.from("subjects").select("*")
      const { data: studentsData } = await supabase.from("students").select("*")
      const { data: attendanceData } = await supabase.from("attendance").select("*")

      if (subjectsData) setSubjects(subjectsData)
      if (studentsData) setStudents(studentsData)
      if (attendanceData) setAttendanceRecords(attendanceData)
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedSubject && selectedDate) {
      const dateString = format(selectedDate, "yyyy-MM-dd")

      const fetchAttendance = async () => {
        const { data } = await supabase
          .from("attendance")
          .select("*")
          .eq("subject_id", selectedSubject)
          .eq("date", dateString)

        const existingRecords = data || []

        // Filter students who are enrolled in this subject
        const studentsInSubject = students.filter((student) => student.subjects?.includes(selectedSubject))

        const attendanceMap = {}
        existingRecords.forEach((record) => {
          attendanceMap[record.student_id] = record.status
        })

        // Initialize attendance for students in subject if not already set
        studentsInSubject.forEach((student) => {
          if (attendanceMap[student.id] === undefined) {
            attendanceMap[student.id] = "absent"
          }
        })

        setCurrentAttendance(attendanceMap)
      }

      fetchAttendance()
    }
  }, [selectedSubject, selectedDate, attendanceRecords, students])

  const handleAttendanceChange = (studentId, status) => {
    setCurrentAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }))
  }

  const saveAttendance = async () => {
    if (!selectedSubject || !selectedDate) return

    setIsSaving(true)
    const dateString = format(selectedDate, "yyyy-MM-dd")

    // Prepare records to upsert
    const recordsToUpsert = Object.entries(currentAttendance).map(([studentId, status]) => ({
      date: dateString,
      subject_id: selectedSubject,
      student_id: studentId,
      status: status,
    }))

    const { error } = await supabase
      .from("attendance")
      .upsert(recordsToUpsert, { onConflict: ["date", "subject_id", "student_id"] })

    if (!error) {
      // Refetch attendance records
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("subject_id", selectedSubject)
        .eq("date", dateString)

      setAttendanceRecords(data || [])
    }

    setIsSaving(false)
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setIsCalendarOpen(false)
  }

  // Get students enrolled in the selected subject
  const studentsInSubject = students.filter((student) =>
    selectedSubject ? student.subjects?.includes(selectedSubject) : false,
  )

  return (
    <TeacherLayout title="Attendance">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Track Attendance</h2>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Select Subject and Date</h3>
            </div>
            <div className="p-4">
              <div className="grid gap-4 sm:grid-cols-2">
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
                <div className="space-y-2">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <div className="relative">
                    <button
                      className="w-full flex items-center justify-start px-3 py-2 border border-gray-300 rounded-md bg-white text-left"
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      id="date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-600" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </button>
                    {isCalendarOpen && (
                      <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-2">
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: 31 }, (_, i) => {
                            const day = new Date()
                            day.setDate(i + 1)
                            return (
                              <button
                                key={i}
                                className={`p-2 text-center rounded-md hover:bg-gray-100 ${
                                  selectedDate && day.getDate() === selectedDate.getDate() ? "bg-gray-200" : ""
                                }`}
                                onClick={() => handleDateSelect(day)}
                              >
                                {day.getDate()}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedSubject && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Attendance Sheet</h3>
              <p className="text-sm text-gray-500 mt-1">
                {format(selectedDate, "MMMM d, yyyy")} - {subjects.find((s) => s.id === selectedSubject)?.name}
                <span className="ml-2 text-gray-600">({studentsInSubject.length} students)</span>
              </p>
            </div>
            <div className="p-4">
              {loading ? (
                <p className="text-center py-4 text-gray-500">Loading attendance data...</p>
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
                          <th className="text-left p-2 text-gray-700">ID</th>
                          <th className="text-left p-2 text-gray-700">Status</th>
                          <th className="text-left p-2 text-gray-700">Current Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsInSubject.map((student) => {
                          const status = currentAttendance[student.id] || "absent"
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
                              <td className="p-2">{student.student_id}</td>
                              <td className="p-2">
                                <select
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                                  value={status}
                                  onChange={(e) => handleAttendanceChange(student.id, e.target.value)}
                                >
                                  <option value="present">Present</option>
                                  <option value="absent">Absent</option>
                                  <option value="late">Late</option>
                                  <option value="excused">Excused</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <div
                                  className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig[status].color}`}
                                >
                                  {statusConfig[status].icon}
                                  <span className="text-sm">{statusConfig[status].label}</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1 text-sm">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span>Present</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <span>Absent</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <span>Late</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        <span>Excused</span>
                      </div>
                    </div>
                    <button
                      className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                      onClick={saveAttendance}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Attendance"}
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  )
}
