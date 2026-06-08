import { useMemo, useState } from "react";
import { Mail } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import AuthSecondaryAction from "../components/auth/AuthSecondaryAction";
import { useFormValidation } from "../modules/shared/hooks/useFormValidation";
import { getAuthEmailError } from "../modules/shared/utils/validation";
import { forgotPassword } from "../services/auth/authApi";
import { toastApiError, toastApiSuccess } from "../services/toast/apiToast";

const FORGOT_PASSWORD_FIELDS = ["email"];

function ForgotPassword({ isDarkMode, onToggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [isSending, setIsSending] = useState(false);

  const errors = useMemo(() => ({ email: getAuthEmailError(email) }), [email]);
  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: FORGOT_PASSWORD_FIELDS,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || errors.email) {
      return;
    }

    setIsSending(true);
    try {
      const data = await forgotPassword({ email: email.trim() });
      toastApiSuccess(data);
      navigate("/auth/verify-otp", { state: { email: email.trim() } });
    } catch (err) {
      toastApiError(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme}>
      <h1
        className={`text-center text-[30px] font-bold leading-tight tracking-[-0.02em] sm:text-[34px] ${
          isDarkMode ? "text-[#f8fafc]" : "text-[#1f2b3d]"
        }`}
      >
        Forgot Password?
      </h1>
      <p
        className={`mt-2 text-center text-[14px] sm:text-[15px] ${
          isDarkMode ? "text-[#9fb0c8]" : "text-[#6f7f96]"
        }`}
      >
        We&apos;ll send an OTP to your email address to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
        <div>
          <label
            htmlFor="forgot-email"
            className={`mb-2 block text-sm font-semibold ${
              isDarkMode ? "text-[#d4deeb]" : "text-[#304157]"
            }`}
          >
            Email
          </label>
          <div
            className={`kh-input-shell flex h-[52px] items-center rounded-2xl border px-4 transition-all duration-200 ${
              showError("email")
                ? "border-[#de3d3d] focus-within:border-[#de3d3d] focus-within:ring-2 focus-within:ring-[#de3d3d]/20"
                : isDarkMode
                  ? "border-[#344662] bg-[#101a2a] focus-within:border-[#24b86b] focus-within:ring-2 focus-within:ring-[#24b86b]/20"
                  : "border-[#d5deea] bg-[#f4f8fc] focus-within:border-[#18a957] focus-within:ring-2 focus-within:ring-[#18a957]/15"
            }`}
          >
            <Mail
              size={16}
              className={isDarkMode ? "text-[#8ea5c2]" : "text-[#8b98ab]"}
            />
            <input
              id="forgot-email"
              name="forgotEmail"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => touch("email")}
              disabled={isSending}
              className={`kh-input h-full w-full bg-transparent pl-2.5 text-[15px] outline-none ${
                isDarkMode
                  ? "text-[#f8fafc] placeholder:text-[#94a3b8]"
                  : "text-[#18202f] placeholder:text-[#8f97a7]"
              }`}
            />
          </div>
          {showError("email") && (
            <p className="mt-1.5 text-xs text-[#de3d3d]">{showError("email")}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSending}
          className="mt-1 flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#10a950] text-base font-semibold text-white shadow-[0_10px_24px_rgba(16,169,80,0.3)] transition-all duration-200 hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:bg-[#6fbd93] disabled:shadow-none"
        >
          {isSending ? "Sending..." : "Send OTP"}
        </button>

        <button
          type="button"
          className="h-11 rounded-xl w-full text-center px-5 text-sm font-semibold transition cursor-pointer disabled:opacity-50 bg-[#f4f8fc] border border-[#dce6f2] text-[#18202f] hover:bg-[#e9f0f7] disabled:border-[#d5deea] disabled:bg-[#f4f8fc] disabled:text-[#18202f]"
          onClick={() => navigate("/auth")}
          disabled={isSending}
        >
          Back
        </button>
      </form>
    </AuthLayout>
  );
}

export default ForgotPassword;
