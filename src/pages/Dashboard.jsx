import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function Dashboard({ isDarkMode, onToggleTheme }) {
  return (
    <div
      className={`flex min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-[#0f1724]" : "bg-[#edf2f8]"
      }`}
    >
      <Sidebar isDarkMode={isDarkMode} />

      <div className="flex-1 min-w-0">
        <Navbar isDarkMode={isDarkMode} onToggleTheme={onToggleTheme} />

        <div className="p-4 sm:p-6">
          <div
            className={`rounded-3xl border p-5 transition-all duration-300 sm:p-7 ${
              isDarkMode
                ? "border-[#283b58] bg-[#131f31] shadow-[0_18px_45px_rgba(2,6,23,0.38)]"
                : "border-[#dce7f3] bg-white shadow-[0_14px_36px_rgba(17,36,65,0.1)]"
            }`}
          >
            <h1
              className={`text-2xl font-bold tracking-[-0.015em] ${
                isDarkMode ? "text-[#f8fafc]" : "text-[#202c3d]"
              }`}
            >
              Dashboard
            </h1>
            <p
              className={`mt-2 max-w-2xl text-sm leading-relaxed ${
                isDarkMode ? "text-[#9fb0c8]" : "text-[#6f8098]"
              }`}
            >
              Welcome to Spade Community. This is the inner home page after
              successful login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

