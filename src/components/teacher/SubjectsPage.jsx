"use client"

import { useState, useEffect } from "react"
import TeacherLayout from "../layout/teacher-layout"
import { Plus, Pencil, Trash } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentSubject, setCurrentSubject] = useState(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    semester: "1st",
    school_year: "",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true)
      const { data, error } = await supabase.from("subjects").select("*").order("created_at", { ascending: false })

      if (!error) {
        setSubjects(data)
      }
      setLoading(false)
    }
    fetchSubjects()
  }, [])

  const handleAddSubject = async () => {
    if (!formData.code || !formData.name) {
      alert("Please fill in all required fields")
      return
    }

    const { data, error } = await supabase.from("subjects").insert([formData]).select()

    if (error) {
      alert("Error adding subject: " + error.message)
      return
    }

    setSubjects([data[0], ...subjects])
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditSubject = async () => {
    if (!currentSubject) return

    const { error } = await supabase.from("subjects").update(formData).eq("id", currentSubject.id)

    if (error) {
      alert("Error updating subject: " + error.message)
      return
    }

    const updatedSubjects = subjects.map((subject) =>
      subject.id === currentSubject.id ? { ...subject, ...formData } : subject,
    )
    setSubjects(updatedSubjects)
    setIsEditDialogOpen(false)
    resetForm()
  }

  const handleDeleteSubject = async () => {
    if (!currentSubject) return

    const { error } = await supabase.from("subjects").delete().eq("id", currentSubject.id)

    if (error) {
      alert("Error deleting subject: " + error.message)
      return
    }

    const updatedSubjects = subjects.filter((subject) => subject.id !== currentSubject.id)
    setSubjects(updatedSubjects)
    setIsDeleteDialogOpen(false)
  }

  const openEditDialog = (subject) => {
    setCurrentSubject(subject)
    setFormData({
      code: subject.code,
      name: subject.name,
      semester: subject.semester,
      school_year: subject.school_year,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (subject) => {
    setCurrentSubject(subject)
    setIsDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      semester: "1st",
      school_year: "",
    })
    setCurrentSubject(null)
  }

  return (
    <TeacherLayout title="Subjects">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Manage Subjects</h2>
          <button
            className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Add Subject</span>
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Subject List</h3>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading subjects...</p>
              </div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No subjects found. Add a subject to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Code</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Name</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Semester</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">School Year</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject) => (
                      <tr key={subject.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 text-sm font-medium text-gray-800">{subject.code}</td>
                        <td className="p-3 text-sm text-gray-700">{subject.name}</td>
                        <td className="p-3 text-sm text-gray-700">{subject.semester}</td>
                        <td className="p-3 text-sm text-gray-700">{subject.school_year}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end">
                            <button
                              className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                              onClick={() => openEditDialog(subject)}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 ml-1"
                              onClick={() => openDeleteDialog(subject)}
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

        {/* Add Subject Modal */}
        {isAddDialogOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800">Add New Subject</h3>
                <p className="text-sm text-gray-600 mt-1">Enter the details for the new subject</p>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Code
                    </label>
                    <input
                      id="code"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g., CS101"
                    />
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Name
                    </label>
                    <input
                      id="name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Introduction to Computer Science"
                    />
                  </div>

                  <div>
                    <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                      Semester
                    </label>
                    <select
                      id="semester"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition bg-white"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    >
                      <option value="1st">1st Semester</option>
                      <option value="2nd">2nd Semester</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="school_year" className="block text-sm font-medium text-gray-700 mb-1">
                      School Year
                    </label>
                    <input
                      id="school_year"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                      value={formData.school_year}
                      onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
                      placeholder="e.g., 2023-2024"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  onClick={handleAddSubject}
                  disabled={!formData.code || !formData.name}
                >
                  Add Subject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Subject Modal */}
        {isEditDialogOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800">Edit Subject</h3>
                <p className="text-sm text-gray-600 mt-1">Update the subject details</p>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-code" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Code
                    </label>
                    <input
                      id="edit-code"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Name
                    </label>
                    <input
                      id="edit-name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-semester" className="block text-sm font-medium text-gray-700 mb-1">
                      Semester
                    </label>
                    <select
                      id="edit-semester"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition bg-white"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    >
                      <option value="1st">1st Semester</option>
                      <option value="2nd">2nd Semester</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-school_year" className="block text-sm font-medium text-gray-700 mb-1">
                      School Year
                    </label>
                    <input
                      id="edit-school_year"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                      value={formData.school_year}
                      onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
                    />
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
                  onClick={handleEditSubject}
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
                <h3 className="text-2xl font-bold text-gray-800">Delete Subject</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete this subject? This action cannot be undone.
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
                  onClick={handleDeleteSubject}
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
