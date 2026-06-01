import { useState } from "react";
import { Link } from "react-router-dom";

function Signup() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 ${
        darkMode ? "bg-[#172744]" : "bg-gray-100"
      }`}
    >
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-5 right-5 px-3 py-2 bg-gray-200 text-white rounded-lg"
      >
        {darkMode ? "☀️ " : "🌙 "}
      </button>

      <div
        className={`w-full max-w-xl p-6 rounded-2xl ${
          darkMode ? "bg-[#1D2D4A]" : "bg-white"
        }`}
      >
        <h1
          className={`text-3xl font-bold text-center mb-2 ${
            darkMode ? "text-white" : "text-black"
          }`}
        >
          Create Account
        </h1>

        <p
          className={`text-center mb-6 ${
            darkMode ? "text-slate-300" : "text-gray-600"
          }`}
        >
          Join the Spade Community
        </p>

        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block mb-2 ${
                  darkMode ? "text-white" : "text-black"
                }`}
              >
                Full Name
              </label>

              <input
                type="text"
                placeholder="Enter your full name"
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                placeholder="Create a password"
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
                Confirm Password
              </label>

              <input
                type="password"
                placeholder="Confirm your password"
                className={`w-full p-3 rounded-lg border outline-none ${
                  darkMode
                    ? "bg-[#061534] text-white border-slate-600"
                    : "bg-gray-100 text-black border-gray-300"
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold"
          >
            Sign Up
          </button>

          <p
            className={`text-center ${
              darkMode ? "text-slate-300" : "text-gray-600"
            }`}
          >
            Already have an account?{" "}
            <Link
              to="/"
              className="text-green-500 font-medium hover:underline"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;