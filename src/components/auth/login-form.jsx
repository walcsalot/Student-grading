import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function LoginForm() {
  const [activeTab, setActiveTab] = useState("login");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "teacher",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (authError) throw authError;

      // Get the full user data to check role
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User data not available");
      }

      // Redirect based on role
      const role = user.user_metadata?.role || "teacher";
      window.location.href =
        role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";
    } catch (err) {
      setError(err.message || "Invalid email or password");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
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
      });

      if (error) throw error;

      // Auto-confirm the user (only works if email confirmations are disabled in Supabase settings)
      if (data.user) {
        await supabase.auth.signInWithPassword({
          email: registerData.email,
          password: registerData.password,
        });
      }

      setError("Registration successful! You can now login.");
      setActiveTab("login");
      setLoginData({ email: registerData.email, password: "" });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-red-100">
          <div className="flex">
            <button
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === "login"
                  ? "border-red-600 text-red-700"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("login")}
            >
              Login
            </button>
            <button
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === "register"
                  ? "border-red-600 text-red-700"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("register")}
            >
              Register (Teachers Only)
            </button>
          </div>

          <div className="p-8">
            {activeTab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">Login</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Enter your credentials to access your account
                  </p>
                </div>

                {error && (
                  <div className="flex items-start p-4 space-x-2 text-sm text-red-600 bg-red-50 rounded-md">
                    <AlertCircle className="h-5 w-5" />
                    <div>{error}</div>
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData({ ...loginData, email: e.target.value })
                    }
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Teacher Registration
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Create a new teacher account
                  </p>
                </div>

                {error && (
                  <div className="flex items-start p-4 space-x-2 text-sm text-red-600 bg-red-50 rounded-md">
                    <AlertCircle className="h-5 w-5" />
                    <div>{error}</div>
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="reg-email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        email: e.target.value,
                      })
                    }
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="reg-password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        password: e.target.value,
                      })
                    }
                    placeholder="Create a password"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="reg-confirm-password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="reg-confirm-password"
                    type="password"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
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

                <input
                  type="hidden"
                  value="teacher"
                  onChange={(e) =>
                    setRegisterData({ ...registerData, role: e.target.value })
                  }
                />

                <div className="text-xs text-gray-500 mt-4">
                  <p>
                    Note: Student registration is only available through the
                    teacher portal after login.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={isLoading}
                >
                  {isLoading ? "Registering..." : "Register Teacher Account"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
