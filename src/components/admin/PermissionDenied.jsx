import { ShieldOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

function PermissionDenied({ isDarkMode, message }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
          isDarkMode ? "bg-[#1f3047]" : "bg-[#eef4fb]"
        }`}
      >
        <ShieldOff size={28} className="text-[var(--admin-warning-text)]" />
      </div>
      <div>
        <h2 className="admin-text text-lg font-semibold">Access Denied</h2>
        <p className="admin-text-muted mt-2 max-w-md text-sm">
          {message ||
            "You do not have permission to view this page. Contact your administrator."}
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate("/")}
        className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white hover:bg-[#0f9b49]"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

export default PermissionDenied;
