import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FiHome, FiCalendar, FiAward, FiUser, FiLogOut, FiMenu, FiX } from "react-icons/fi"
import { supabase } from "../../lib/supabaseClient"

export default function StudentLayout({ children, title }) {
  const [user, setUser] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get the current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error || !session) {
          navigate("/")
          return
        }

        // Get the user data from auth and users table
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !authUser) {
          navigate("/")
          return
        }

        // Check role from user_metadata or users table
        let userRole = authUser.user_metadata?.role

        // If not in metadata, check users table
        if (!userRole) {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("role")
            .eq("id", authUser.id)
            .single()

          if (!userError && userData) {
            userRole = userData.role
          }
        }

        // Verify student role
        if (userRole !== "student") {
          navigate("/")
          return
        }

        // Get additional student data
        const { data: studentData } = await supabase.from("students").select("*").eq("email", authUser.email).single()

        if (!studentData) {
          console.error("No student data found")
          return
        }

        setUser({
          ...authUser,
          ...studentData,
          username: studentData?.student_id || authUser.email,
          photo: studentData?.photo,
          full_name: studentData?.full_name,
        })
      } catch (err) {
        console.error("Error fetching user:", err)
        navigate("/")
      }
    }

    fetchUser()
  }, [navigate])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      navigate("/")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header for desktop */}
      <header className="bg-gray-800 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and title with profile picture */}
            <div className="flex items-center">
              <h2 className="text-xl font-bold">Student Portal</h2>
              <div className="hidden md:flex items-center ml-4">
                <div className="h-10 w-10 rounded-full bg-gray-600 overflow-hidden flex items-center justify-center border-2 border-gray-500 mr-3">
                  {user?.photo ? (
                    <img
                      src={user.photo || "/placeholder.svg"}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none"
                        e.target.nextSibling.style.display = "flex"
                      }}
                    />
                  ) : null}
                  <span
                    className={`text-gray-300 font-medium text-sm ${user?.photo ? "hidden" : "flex"}`}
                    style={{ display: user?.photo ? "none" : "flex" }}
                  >
                    {user?.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") ||
                      user?.username?.substring(0, 2).toUpperCase() ||
                      "ST"}
                  </span>
                </div>
                <span className="text-sm text-gray-300">Welcome, {user?.full_name || user?.username || "Student"}</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <a href="/student/dashboard" className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                <span className="flex items-center">
                  <FiHome className="mr-2" />
                  Dashboard
                </span>
              </a>
              <a href="/student/attendance" className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                <span className="flex items-center">
                  <FiCalendar className="mr-2" />
                  Attendance
                </span>
              </a>
              <a href="/student/grades" className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                <span className="flex items-center">
                  <FiAward className="mr-2" />
                  Grades
                </span>
              </a>
              <a href="/student/profile" className="px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                <span className="flex items-center">
                  <FiUser className="mr-2" />
                  Profile
                </span>
              </a>

              {/* Logout Button */}
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
            <div className="md:hidden flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gray-600 overflow-hidden flex items-center justify-center border-2 border-gray-500">
                {user?.photo ? (
                  <img
                    src={user.photo || "/placeholder.svg"}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none"
                      e.target.nextSibling.style.display = "flex"
                    }}
                  />
                ) : null}
                <span
                  className={`text-gray-300 font-medium text-sm ${user?.photo ? "hidden" : "flex"}`}
                  style={{ display: user?.photo ? "none" : "flex" }}
                >
                  {user?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") ||
                    user?.username?.substring(0, 2).toUpperCase() ||
                    "ST"}
                </span>
              </div>
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
            <a
              href="/student/dashboard"
              className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiHome className="mr-3" />
              <span>Dashboard</span>
            </a>
            <a
              href="/student/attendance"
              className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiCalendar className="mr-3" />
              <span>Attendance</span>
            </a>
            <a href="/student/grades" className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <FiAward className="mr-3" />
              <span>Grades</span>
            </a>
            <a href="/student/profile" className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <FiUser className="mr-3" />
              <span>Profile</span>
            </a>
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
