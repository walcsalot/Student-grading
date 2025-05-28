import { useState } from "react"
import { AlertCircle, GraduationCap } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"

export default function LoginForm() {
  const [activeTab, setActiveTab] = useState("login")
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "teacher",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      if (authError) throw authError

      // Get the full user data to check role
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User data not available")
      }

      // Redirect based on role
      const role = user.user_metadata?.role || "teacher"
      window.location.href = role === "teacher" ? "/teacher/dashboard" : "/student/dashboard"
    } catch (err) {
      setError(err.message || "Invalid email or password")
      console.error("Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            role: registerData.role,
          },
        },
      })

      if (error) throw error

      // Auto-confirm the user (only works if email confirmations are disabled in Supabase settings)
      if (data.user) {
        await supabase.auth.signInWithPassword({
          email: registerData.email,
          password: registerData.password,
        })
      }

      setError("Registration successful! You can now login.")
      setActiveTab("login")
      setLoginData({ email: registerData.email, password: "" })
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.")
      console.error("Registration error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex">
        <div className="container mx-auto flex">
          <div className="flex flex-col lg:flex-row w-full">
            {/* Left side - Logo and Title */}
            <div className="lg:w-1/2 p-8 flex flex-col justify-center items-center">
              <div className="max-w-lg w-full">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <GraduationCap className="h-16 w-16 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">Student Management System</h1>
                    <p className="text-lg text-gray-600">Manage students, attendance, and grades efficiently</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Login/Register Card */}
            <div className="lg:w-1/2 p-8 flex items-center justify-center lg:justify-start">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full max-w-md">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="flex">
                    <button
                      className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
                        activeTab === "login"
                          ? "bg-gray-50 text-gray-800 border-b-2 border-gray-700"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      }`}
                      onClick={() => setActiveTab("login")}
                    >
                      Sign In
                    </button>
                    <button
                      className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
                        activeTab === "register"
                          ? "bg-gray-50 text-gray-800 border-b-2 border-gray-700"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      }`}
                      onClick={() => setActiveTab("register")}
                    >
                      Teacher Registration
                    </button>
                  </nav>
                </div>

                {/* Form Content */}
                <div className="p-6">
                  {activeTab === "login" ? (
                    <form onSubmit={handleLogin} className="space-y-6">
                      <div className="text-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
                        <p className="mt-2 text-gray-600">Sign in to access your dashboard</p>
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                            <div className="text-sm text-red-700">{error}</div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            id="email"
                            type="email"
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                            value={loginData.email}
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                            placeholder="Enter your email address"
                          />
                        </div>

                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                          </label>
                          <input
                            id="password"
                            type="password"
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            placeholder="Enter your password"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gray-700 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing in..." : "Sign In"}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-6">
                      <div className="text-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Create Teacher Account</h2>
                        <p className="mt-2 text-gray-600">Register as a teacher to manage students and classes</p>
                      </div>

                      {error && (
                        <div
                          className={`border rounded-lg p-4 ${
                            error.includes("successful") ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <AlertCircle
                              className={`h-5 w-5 mt-0.5 ${
                                error.includes("successful") ? "text-green-500" : "text-red-500"
                              }`}
                            />
                            <div
                              className={`text-sm ${error.includes("successful") ? "text-green-700" : "text-red-700"}`}
                            >
                              {error}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            id="reg-email"
                            type="email"
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                            value={registerData.email}
                            onChange={(e) =>
                              setRegisterData({
                                ...registerData,
                                email: e.target.value,
                              })
                            }
                            placeholder="Enter your email address"
                          />
                        </div>

                        <div>
                          <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                          </label>
                          <input
                            id="reg-password"
                            type="password"
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                            value={registerData.password}
                            onChange={(e) =>
                              setRegisterData({
                                ...registerData,
                                password: e.target.value,
                              })
                            }
                            placeholder="Create a secure password"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="reg-confirm-password"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Confirm Password
                          </label>
                          <input
                            id="reg-confirm-password"
                            type="password"
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors"
                            value={registerData.confirmPassword}
                            onChange={(e) =>
                              setRegisterData({
                                ...registerData,
                                confirmPassword: e.target.value,
                              })
                            }
                            placeholder="Confirm your password"
                          />
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm text-blue-800">
                          <strong>Note:</strong> Student registration is only available through the teacher portal after
                          login.
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gray-700 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                      >
                        {isLoading ? "Creating Account..." : "Create Teacher Account"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
