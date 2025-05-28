import { useState, useEffect } from "react"
import TeacherLayout from "../layout/teacher-layout"
import { Plus, Pencil, Trash, Upload } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentStudent, setCurrentStudent] = useState(null)
  const [formData, setFormData] = useState({
    student_id: "",
    full_name: "",
    email: "",
    password: "",
    subjects: [],
    photo: null,
  })
  const [photoPreview, setPhotoPreview] = useState(null)
  const [credentials, setCredentials] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const { data: subjectsData } = await supabase.from("subjects").select("*")
      const { data: studentsData } = await supabase.from("students").select("*")

      if (subjectsData) setSubjects(subjectsData)
      if (studentsData) setStudents(studentsData)
      setLoading(false)
    }

    fetchData()
  }, [])

  const registerStudentAccount = async (studentData) => {
    const { error } = await supabase.auth.signUp({
      email: studentData.email,
      password: studentData.password || "password",
      options: {
        data: {
          role: "student",
          student_id: studentData.student_id,
          full_name: studentData.full_name,
        },
      },
    })

    if (error) return { error: error.message }

    return {
      email: studentData.email,
      password: studentData.password || "password",
    }
  }

  const handleAddStudent = async () => {
    if (!formData.student_id || !formData.full_name || !formData.email) {
      alert("Please fill in all required fields")
      return
    }

    // Register auth account
    const accountResult = await registerStudentAccount(formData)
    if (accountResult.error) {
      alert(accountResult.error)
      return
    }

    // Create student record
    const { data, error } = await supabase
      .from("students")
      .insert([
        {
          student_id: formData.student_id,
          full_name: formData.full_name,
          email: formData.email,
          subjects: formData.subjects,
          photo: formData.photo,
        },
      ])
      .select()

    if (error) {
      alert("Error creating student record: " + error.message)
      return
    }

    setStudents([data[0], ...students])
    setCredentials(accountResult)
    setTimeout(() => {
      setIsAddDialogOpen(false)
      resetForm()
    }, 5000)
  }

  const handleEditStudent = async () => {
    if (!currentStudent) return

    const { error } = await supabase
      .from("students")
      .update({
        full_name: formData.full_name,
        email: formData.email,
        subjects: formData.subjects,
        photo: formData.photo,
      })
      .eq("id", currentStudent.id)

    if (error) {
      alert("Error updating student: " + error.message)
      return
    }

    // Update auth user if email changed
    if (formData.email !== currentStudent.email) {
      await supabase.auth.admin.updateUserById(currentStudent.id, {
        email: formData.email,
        user_metadata: {
          full_name: formData.full_name,
        },
      })
    }

    const updatedStudents = students.map((student) =>
      student.id === currentStudent.id ? { ...student, ...formData } : student,
    )
    setStudents(updatedStudents)
    setIsEditDialogOpen(false)
    resetForm()
  }

  const handleDeleteStudent = async () => {
    if (!currentStudent) return

    // Delete student record
    const { error } = await supabase.from("students").delete().eq("id", currentStudent.id)

    if (error) {
      alert("Error deleting student: " + error.message)
      return
    }

    // Delete auth user
    await supabase.auth.admin.deleteUser(currentStudent.id)

    const updatedStudents = students.filter((student) => student.id !== currentStudent.id)
    setStudents(updatedStudents)
    setIsDeleteDialogOpen(false)
  }

  const openEditDialog = (student) => {
    setCurrentStudent(student)
    setFormData({
      student_id: student.student_id,
      full_name: student.full_name,
      email: student.email,
      subjects: student.subjects || [],
      photo: student.photo,
    })
    setPhotoPreview(student.photo)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (student) => {
    setCurrentStudent(student)
    setIsDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      student_id: "",
      full_name: "",
      email: "",
      password: "",
      subjects: [],
      photo: null,
    })
    setPhotoPreview(null)
    setCurrentStudent(null)
    setCredentials(null)
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        setFormData({ ...formData, photo: base64String })
        setPhotoPreview(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubjectChange = (subjectId) => {
    setFormData((prev) => {
      const newSubjects = prev.subjects.includes(subjectId)
        ? prev.subjects.filter((id) => id !== subjectId)
        : [...prev.subjects, subjectId]
      return { ...prev, subjects: newSubjects }
    })
  }

  return (
    <TeacherLayout title="Students">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Manage Students</h2>
          <button
            className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
            onClick={() => {
              setIsAddDialogOpen(true)
              setCredentials(null)
            }}
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Add Student</span>
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Student List</h3>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No students found. Add a student to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Photo</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Student ID</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Name</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Email</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Subjects</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                            {student.photo ? (
                              <img
                                src={student.photo || "/placeholder.svg"}
                                alt={student.full_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-400 font-medium">
                                {student.full_name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-700">{student.student_id}</td>
                        <td className="p-3 text-sm font-medium text-gray-800">{student.full_name}</td>
                        <td className="p-3 text-sm text-gray-700">{student.email}</td>
                        <td className="p-3 text-sm text-gray-700">
                          {student.subjects?.length > 0
                            ? student.subjects.map((id) => subjects.find((s) => s.id === id)?.name).join(", ")
                            : "No subjects"}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end">
                            <button
                              className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                              onClick={() => openEditDialog(student)}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 ml-1"
                              onClick={() => openDeleteDialog(student)}
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add Student Modal */}
        {isAddDialogOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800">Add New Student</h3>
                <p className="text-sm text-gray-600 mt-1">Enter the details for the new student account</p>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="student_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Student ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="student_id"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      placeholder="e.g., 2023-12345"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="full_name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="e.g., John Doe"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g., ...@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Leave blank to use 'password'"
                    />
                    <p className="text-xs text-gray-500 mt-1">Default password: "password"</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subjects <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {subjects.map((subject) => (
                        <label key={subject.id} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={formData.subjects.includes(subject.id)}
                            onChange={() => handleSubjectChange(subject.id)}
                            className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                          />
                          <span className="text-sm text-gray-700">
                            {subject.name} <span className="text-gray-500">({subject.code})</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-20 w-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-gray-300">
                          {photoPreview ? (
                            <img
                              src={photoPreview || "/placeholder.svg"}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400 font-medium text-lg">
                              {formData.full_name
                                ? formData.full_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                : "ST"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <input
                          id="photo"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="photo"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center cursor-pointer transition"
                        >
                          <Upload className="mr-2 h-4 w-4 text-gray-500" />
                          <span className="text-sm">Upload Photo</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {credentials && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-sm text-blue-800 mb-2">Student Account Created</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-600">Email:</div>
                      <div className="font-mono text-blue-700 break-all">{credentials.email}</div>
                      <div className="text-gray-600">Password:</div>
                      <div className="font-mono text-blue-700">{credentials.password}</div>
                    </div>
                    <p className="text-xs mt-2 text-gray-600">Please provide these credentials to the student.</p>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAddStudent}
                  disabled={
                    !formData.student_id || !formData.full_name || !formData.email || formData.subjects.length === 0
                  }
                >
                  Add Student
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Student Modal */}
        {isEditDialogOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800">Edit Student</h3>
                <p className="text-sm text-gray-600 mt-1">Update the student details</p>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-student_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Student ID
                    </label>
                    <input
                      id="edit-student_id"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      value={formData.student_id}
                      readOnly
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-full_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      id="edit-full_name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="edit-email"
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                    <div className="grid grid-cols-2 gap-3">
                      {subjects.map((subject) => (
                        <label key={subject.id} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={formData.subjects.includes(subject.id)}
                            onChange={() => handleSubjectChange(subject.id)}
                            className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                          />
                          <span className="text-sm text-gray-700">
                            {subject.name} <span className="text-gray-500">({subject.code})</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-20 w-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-gray-300">
                          {photoPreview ? (
                            <img
                              src={photoPreview || "/placeholder.svg"}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400 font-medium text-lg">
                              {formData.full_name
                                ? formData.full_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                : "ST"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <input
                          id="edit-photo"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="edit-photo"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center cursor-pointer transition"
                        >
                          <Upload className="mr-2 h-4 w-4 text-gray-500" />
                          <span className="text-sm">Change Photo</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  onClick={handleEditStudent}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteDialogOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800">Delete Student</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete this student? This action cannot be undone.
                </p>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  onClick={handleDeleteStudent}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  )
}
