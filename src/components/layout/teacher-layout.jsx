"use client"

import { useState, useEffect } from "react"
import { FiHome, FiBook, FiUsers, FiCalendar, FiAward, FiFileText, FiLogOut, FiMenu, FiX } from "react-icons/fi"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"

export default function TeacherLayout({ children, title }) {
  const [user, setUser] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error || !session) {
        navigate("/")
        return
      }

      // Force refresh the session if needed
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        navigate("/")
        return
      }

      if (user.user_metadata?.role !== "teacher") {
        navigate("/")
        return
      }

      setUser({
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role,
        username: user.user_metadata?.username || user.email.split("@")[0],
      })
    }

    checkSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/")
      } else if (session?.user) {
        if (session.user.user_metadata?.role === "teacher") {
          setUser({
            id: session.user.id,
            email: session.user.email,
            role: session.user.user_metadata?.role,
            username: session.user.user_metadata?.username || session.user.email.split("@")[0],
          })
        } else {
          navigate("/")
        }
      }
    })

    return () => {
      if (authListener?.unsubscribe) {
        authListener.unsubscribe()
      }
    }
  }, [navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/")
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  if (!user) {
    return null // or a loading spinner
  }

  // Helper function to handle navigation
  const handleNavigation = (path) => {
    navigate(path)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header for desktop */}
      <header className="bg-gray-800 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and title */}
            <div className="flex items-center">
              <h2 className="text-xl font-bold">Teacher Portal</h2>
              <span className="hidden md:inline-block ml-4 text-sm text-gray-300">
                Welcome, {user?.username || "Teacher"}
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => handleNavigation("/teacher/dashboard")}
                className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                <span className="flex items-center">
                  <FiHome className="mr-2" />
                  Dashboard
                </span>
              </button>
              <button
                onClick={() => handleNavigation("/teacher/subjects")}
                className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                <span className="flex items-center">
                  <FiBook className="mr-2" />
                  Subjects
                </span>
              </button>
              <button
                onClick={() => handleNavigation("/teacher/students")}
                className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                <span className="flex items-center">
                  <FiUsers className="mr-2" />
                  Students
                </span>
              </button>
              <button
                onClick={() => handleNavigation("/teacher/attendance")}
                className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                <span className="flex items-center">
                  <FiCalendar className="mr-2" />
                  Attendance
                </span>
              </button>
              <button
                onClick={() => handleNavigation("/teacher/grades")}
                className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                <span className="flex items-center">
                  <FiAward className="mr-2" />
                  Grades
                </span>
              </button>
              <button
                onClick={() => handleNavigation("/teacher/reports")}
                className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                <span className="flex items-center">
                  <FiFileText className="mr-2" />
                  Reports
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="ml-4 px-3 py-2 border border-gray-600 rounded-md hover:bg-gray-700 transition-colors"
              >
                <span className="flex items-center">
                  <FiLogOut className="mr-2" />
                  Logout
                </span>
              </button>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-white" onClick={toggleMobileMenu}>
                {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Page title bar */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-sm">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => handleNavigation("/teacher/dashboard")}
              className="w-full flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <FiHome className="mr-3" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => handleNavigation("/teacher/subjects")}
              className="w-full flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <FiBook className="mr-3" />
              <span>Subjects</span>
            </button>
            <button
              onClick={() => handleNavigation("/teacher/students")}
              className="w-full flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <FiUsers className="mr-3" />
              <span>Students</span>
            </button>
            <button
              onClick={() => handleNavigation("/teacher/attendance")}
              className="w-full flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <FiCalendar className="mr-3" />
              <span>Attendance</span>
            </button>
            <button
              onClick={() => handleNavigation("/teacher/grades")}
              className="w-full flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <FiAward className="mr-3" />
              <span>Grades</span>
            </button>
            <button
              onClick={() => handleNavigation("/teacher/reports")}
              className="w-full flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <FiFileText className="mr-3" />
              <span>Reports</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <FiLogOut className="mr-3" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 overflow-y-auto p-4 bg-gray-100">{children}</main>
    </div>
  )
}
