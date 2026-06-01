import { useState } from "react";
import { Link } from "react-router-dom";

function Login() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        darkMode ? "bg-[#172744]" : "bg-gray-100"
      }`}
    >
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-5 right-5 px-4 py-2 bg-gray-300 text-white rounded-lg"
      >
        {darkMode ? "☀️ " : "🌙 "}
      </button>

      <div
        className={`w-full max-w-md p-8 rounded-2xl ${
          darkMode ? "bg-[#1D2D4A]" : "bg-white"
        }`}
      >
        <h1
          className={`text-3xl font-bold text-center mb-2 ${
            darkMode ? "text-white" : "text-black"
          }`}
        >
          Welcome Back
        </h1>

        <p
          className={`text-center mb-6 ${
            darkMode ? "text-slate-300" : "text-gray-600"
          }`}
        >
          Sign in to your Spade Community account
        </p>

        <form className="space-y-4">
          <div>
            <label
              className={`block mb-2 ${
                darkMode ? "text-white" : "text-black"
              }`}
            >
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className={`w-full p-3 rounded-lg border outline-none ${
                darkMode
                  ? "bg-[#061534] text-white border-slate-600"
                  : "bg-gray-100 text-black border-gray-300"
              }`}
            />
          </div>

          <div>
            <label
              className={`block mb-2 ${
                darkMode ? "text-white" : "text-black"
              }`}
            >
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              className={`w-full p-3 rounded-lg border outline-none ${
                darkMode
                  ? "bg-[#061534] text-white border-slate-600"
                  : "bg-gray-100 text-black border-gray-300"
              }`}
            />

            <div className="flex justify-end mt-2">
              <Link
                to="/forgot-password"
                className="text-green-500 text-sm hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold"
          >
            Login
          </button>

          <p
            className={`text-center ${
              darkMode ? "text-slate-300" : "text-gray-600"
            }`}
          >
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-green-500 font-medium hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;