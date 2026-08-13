import { useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import { resetPassword } from "../services/auth/authApi";
import {
  clearPasswordResetSession,
  readPasswordResetEmail,
  readPasswordResetOtp,
  savePasswordResetEmail,
  savePasswordResetOtp,
} from "../services/auth/passwordResetSession";
import { toastApiError, toastApiSuccess } from "../services/toast/apiToast";
import {
  PASSWORD_FIELD_MAX_LENGTH,
  getPasswordError,
  getConfirmPasswordError,
} from "../modules/shared/utils/validation";

function ResetPassword({ isDarkMode, onToggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = String(location.state?.email ?? "").trim();
  const otpFromState = String(location.state?.otp ?? "").trim();
  const [email] = useState(
    () => emailFromState || readPasswordResetEmail()
  );
  const [otp] = useState(() => otpFromState || readPasswordResetOtp());
  const sessionExpired = !email || !otp;

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
    if (email && otp) {
      savePasswordResetEmail(email);
      savePasswordResetOtp(otp);
    }
  }, [email, otp]);

  const passwordError = getPasswordError(password);
  const confirmPasswordError = getConfirmPasswordError(password, confirmPassword);

  const showPasswordError = touched.password && Boolean(passwordError);
  const showConfirmPasswordError =
    touched.confirmPassword && Boolean(confirmPasswordError);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (sessionExpired) {
      return;
    }
    setTouched({ password: true, confirmPassword: true });

    if (passwordError || confirmPasswordError) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await resetPassword({
        email: email.trim(),
        otp: String(otp).trim(),
        password,
        confirmPassword,
        newPassword: password,
      });
      toastApiSuccess(response);
      clearPasswordResetSession();
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

      {sessionExpired ? (
        <div className="mt-6 space-y-5 text-center">
          <p
            className={`text-[14px] sm:text-[15px] ${
              isDarkMode ? "text-[#9fb0c8]" : "text-[#6f7f96]"
            }`}
          >
            Your password reset session has expired. Please verify a new OTP to
            continue.
          </p>
          <button
            type="button"
            className="mt-1 flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#10a950] text-base font-semibold text-white shadow-[0_10px_24px_rgba(16,169,80,0.3)] transition-all duration-200 hover:bg-[#0f9b49]"
            onClick={() => navigate("/auth/forgot-password", { replace: true })}
          >
            Start Password Reset
          </button>
          <button
            type="button"
            className="h-11 rounded-xl w-full text-center px-5 text-sm font-semibold transition cursor-pointer bg-[#f4f8fc] border border-[#dce6f2] text-[#18202f] hover:bg-[#e9f0f7]"
            onClick={() => navigate("/auth", { replace: true })}
          >
            Return To Login Page
          </button>
        </div>
      ) : (
        <>
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
                  maxLength={PASSWORD_FIELD_MAX_LENGTH}
                  disabled={isResetting}
                  onChange={(event) => setPassword(event.target.value)}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, password: true }))
                  }
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
                <p className="mt-1.5 text-xs text-[#de3d3d]">{passwordError}</p>
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
                  showConfirmPasswordError
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
                  maxLength={PASSWORD_FIELD_MAX_LENGTH}
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
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {showConfirmPasswordError && (
                <p className="mt-1.5 text-xs text-[#de3d3d]">
                  {confirmPasswordError}
                </p>
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
        </>
      )}
    </AuthLayout>
  );
}

export default ResetPassword;
