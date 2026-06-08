import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import AuthSecondaryAction from "../components/auth/AuthSecondaryAction";
import { resetPassword } from "../services/auth/authApi";
import { toastApiError, toastApiSuccess } from "../services/toast/apiToast";

const getPasswordStrength = (password) => {
  if (!password) {
    return { score: 0, label: "Weak" };
  }
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  const labels = ["Weak", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] };
};

function ResetPassword({ isDarkMode, onToggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const otp = location.state?.otp || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!email || !otp) {
      navigate("/auth/forgot-password", { replace: true });
    }
  }, [email, otp, navigate]);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch =
    password.trim().length > 0 && password === confirmPassword;

  const showPasswordError = touched.password && password.trim().length === 0;
  const showConfirmPasswordError =
    touched.confirmPassword && confirmPassword.trim().length === 0;
  const showMismatchError =
    touched.confirmPassword &&
    confirmPassword.trim().length > 0 &&
    password !== confirmPassword;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ password: true, confirmPassword: true });

    if (!password.trim() || !confirmPassword.trim() || !passwordsMatch) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await resetPassword({
        email: email.trim(),
        otp: String(otp).trim(),
        newPassword: password,
      });
      toastApiSuccess(response);
      navigate("/auth", { replace: true, state: { email: email.trim() } });
    } catch (err) {
      toastApiError(err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AuthLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme}>
      <h1
        className={`text-center text-[30px] font-bold leading-tight tracking-[-0.02em] sm:text-[34px] ${
          isDarkMode ? "text-[#f8fafc]" : "text-[#1f2b3d]"
        }`}
      >
        Create New Password
      </h1>
      <p
        className={`mt-2 text-center text-[14px] sm:text-[15px] ${
          isDarkMode ? "text-[#9fb0c8]" : "text-[#6f7f96]"
        }`}
      >
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <div>
          <label
            htmlFor="new-password"
            className={`mb-2 block text-sm font-semibold ${
              isDarkMode ? "text-[#d4deeb]" : "text-[#304157]"
            }`}
          >
            New Password
          </label>
          <div
            className={`kh-input-shell flex h-[52px] items-center rounded-2xl border px-4 transition-all duration-200 ${
              showPasswordError
                ? "border-[#de3d3d] focus-within:border-[#de3d3d] focus-within:ring-2 focus-within:ring-[#de3d3d]/20"
                : isDarkMode
                  ? "border-[#344662] bg-[#101a2a] focus-within:border-[#24b86b] focus-within:ring-2 focus-within:ring-[#24b86b]/20"
                  : "border-[#d5deea] bg-[#f4f8fc] focus-within:border-[#18a957] focus-within:ring-2 focus-within:ring-[#18a957]/15"
            }`}
          >
            <LockKeyhole
              size={16}
              className={isDarkMode ? "text-[#8ea5c2]" : "text-[#8b98ab]"}
            />
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter new password"
              value={password}
              disabled={isResetting}
              onChange={(event) => setPassword(event.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              className={`kh-input h-full w-full bg-transparent pl-2.5 text-[15px] outline-none ${
                isDarkMode
                  ? "text-[#f8fafc] placeholder:text-[#94a3b8]"
                  : "text-[#18202f] placeholder:text-[#8f97a7]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className={`ml-2 transition-colors ${
                isDarkMode
                  ? "text-[#8ea5c2] hover:text-[#d4deeb]"
                  : "text-[#97a1b0] hover:text-[#4c5f77]"
              }`}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {showPasswordError && (
            <p className="mt-1.5 text-xs text-[#de3d3d]">New Password is required.</p>
          )}
          {!!password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={`h-1.5 flex-1 rounded-full ${
                      strength.score >= step
                        ? "bg-[#18a354]"
                        : isDarkMode
                          ? "bg-[#334155]"
                          : "bg-[#d8e0ea]"
                    }`}
                  />
                ))}
              </div>
              <p
                className={`mt-1 text-xs ${
                  isDarkMode ? "text-[#94a3b8]" : "text-[#7b8799]"
                }`}
              >
                Password strength: {strength.label}
              </p>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className={`mb-2 block text-sm font-semibold ${
              isDarkMode ? "text-[#d4deeb]" : "text-[#304157]"
            }`}
          >
            Confirm New Password
          </label>
          <div
            className={`kh-input-shell flex h-[52px] items-center rounded-2xl border px-4 transition-all duration-200 ${
              showConfirmPasswordError || showMismatchError
                ? "border-[#de3d3d] focus-within:border-[#de3d3d] focus-within:ring-2 focus-within:ring-[#de3d3d]/20"
                : isDarkMode
                  ? "border-[#344662] bg-[#101a2a] focus-within:border-[#24b86b] focus-within:ring-2 focus-within:ring-[#24b86b]/20"
                  : "border-[#d5deea] bg-[#f4f8fc] focus-within:border-[#18a957] focus-within:ring-2 focus-within:ring-[#18a957]/15"
            }`}
          >
            <LockKeyhole
              size={16}
              className={isDarkMode ? "text-[#8ea5c2]" : "text-[#8b98ab]"}
            />
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirmPassword}
              disabled={isResetting}
              onChange={(event) => setConfirmPassword(event.target.value)}
              onBlur={() =>
                setTouched((prev) => ({ ...prev, confirmPassword: true }))
              }
              className={`kh-input h-full w-full bg-transparent pl-2.5 text-[15px] outline-none ${
                isDarkMode
                  ? "text-[#f8fafc] placeholder:text-[#94a3b8]"
                  : "text-[#18202f] placeholder:text-[#8f97a7]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className={`ml-2 transition-colors ${
                isDarkMode
                  ? "text-[#8ea5c2] hover:text-[#d4deeb]"
                  : "text-[#97a1b0] hover:text-[#4c5f77]"
              }`}
              aria-label={
                showConfirmPassword ? "Hide confirm password" : "Show confirm password"
              }
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {showConfirmPasswordError && (
            <p className="mt-1.5 text-xs text-[#de3d3d]">
              Confirm Password is required.
            </p>
          )}
          {showMismatchError && (
            <p className="mt-1.5 text-xs text-[#de3d3d]">Passwords must match.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isResetting}
          className="mt-1 flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#10a950] text-base font-semibold text-white shadow-[0_10px_24px_rgba(16,169,80,0.3)] transition-all duration-200 hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:bg-[#6fbd93] disabled:shadow-none"
        >
          {isResetting ? "Resetting..." : "Reset Password"}
        </button>

        <button
          type="button"
          className="h-11 rounded-xl w-full text-center px-5 text-sm font-semibold transition cursor-pointer disabled:opacity-50 bg-[#f4f8fc] border border-[#dce6f2] text-[#18202f] hover:bg-[#e9f0f7] disabled:border-[#d5deea] disabled:bg-[#f4f8fc] disabled:text-[#18202f]"
          onClick={() => navigate("/auth")}
          disabled={isResetting}
        >
          Return To Login Page
        </button>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
