import { ShieldOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resolveAuthenticatedLandingPath } from "../../modules/permissions/resolveAuthenticatedLandingPath";

export function PermissionDeniedContent({
  isDarkMode,
  message,
  onAction,
  actionLabel = "Go to Home",
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
          isDarkMode ? "bg-[#1f3047]" : "bg-[#eef4fb]"
        }`}
      >
        <ShieldOff size={28} className="text-[var(--admin-warning-text)]" />
      </div>
      <div>
        <h2 id="permission-denied-title" className="admin-text text-lg font-semibold">
          Access Denied
        </h2>
        <p className="admin-text-muted mt-2 max-w-md text-sm">
          {message ||
            "You do not have permission to view this page. Contact your administrator."}
        </p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white hover:bg-[#0f9b49]"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function PermissionDenied({ isDarkMode, message }) {
  const navigate = useNavigate();

  return (
    <div className="py-14">
      <PermissionDeniedContent
        isDarkMode={isDarkMode}
        message={message}
        onAction={() => navigate(resolveAuthenticatedLandingPath())}
      />
    </div>
  );
}

export function PermissionDeniedModal({
  isOpen,
  onClose,
  isDarkMode,
  message,
}) {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className="admin-header-overlay absolute inset-0 cursor-pointer"
        aria-label="Close access denied"
        onClick={onClose}
      />
      <div
        className="admin-header-surface admin-modal-panel relative z-10 w-full max-w-md rounded-2xl border px-5 py-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="permission-denied-title"
      >
        <PermissionDeniedContent
          isDarkMode={isDarkMode}
          message={message}
          onAction={onClose}
          actionLabel="Close"
        />
      </div>
    </div>
  );
}

export default PermissionDenied;
