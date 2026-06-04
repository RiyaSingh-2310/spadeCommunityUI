import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import { forgotPassword, verifyOtp } from "../services/auth/authApi";
import { toastApiError, toastApiSuccess } from "../services/toast/apiToast";

const OTP_LENGTH = 6;

const maskEmail = (email) => {
  if (!email || !email.includes("@")) {
    return "joh*****@gmail.com";
  }
  const [name, domain] = email.split("@");
  const visiblePart = name.slice(0, 3);
  return `${visiblePart}${"*".repeat(Math.max(5, name.length - 3))}@${domain}`;
};

function VerifyOtp({ isDarkMode, onToggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const maskedEmail = useMemo(() => maskEmail(email), [email]);

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate("/auth/forgot-password", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timer === 0) {
      return undefined;
    }
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const otpValue = otp.join("");

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) {
      return;
    }
    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);
    setError("");
    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) {
      return;
    }
    const nextOtp = Array(OTP_LENGTH)
      .fill("")
      .map((_, idx) => pasted[idx] || "");
    setOtp(nextOtp);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputsRef.current[focusIndex]?.focus();
    setError("");
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (otpValue.length !== OTP_LENGTH) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setIsVerifying(true);
    setError("");
    try {
      const data = await verifyOtp({ email, otp: otpValue });
      toastApiSuccess(data);
      navigate("/auth/reset-password", {
        state: { email, otp: otpValue },
      });
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Invalid OTP. Please try again."
      );
      toastApiError(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || isResending) {
      return;
    }

    if (!email) {
      navigate("/auth/forgot-password", { replace: true });
      return;
    }

    setIsResending(true);
    setError("");
    try {
      const data = await forgotPassword({ email });
      toastApiSuccess(data);
      setTimer(30);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    } catch (err) {
      toastApiError(err);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme}>
      <h1
        className={`text-center text-[30px] font-bold leading-tight tracking-[-0.02em] sm:text-[34px] ${
          isDarkMode ? "text-[#f8fafc]" : "text-[#1f2b3d]"
        }`}
      >
        Verify Your Email
      </h1>
      <p
        className={`mt-2 text-center text-[14px] sm:text-[15px] ${
          isDarkMode ? "text-[#9fb0c8]" : "text-[#6f7f96]"
        }`}
      >
        Enter the verification code sent to your email address.
      </p>
      <p className="mt-2 text-center text-sm font-semibold text-[#18a354]">
        {maskedEmail}
      </p>

      <form onSubmit={handleVerify} className="mt-6 space-y-5">
        <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {otp.map((value, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value}
              disabled={isVerifying}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              aria-label={`OTP digit ${index + 1}`}
              className={`h-12 w-11 rounded-xl border text-center text-lg font-semibold outline-none transition-all duration-200 sm:w-12 ${
                isDarkMode
                  ? "border-[#344662] bg-[#101a2a] text-[#f8fafc] focus:border-[#24b86b] focus:ring-2 focus:ring-[#24b86b]/20"
                  : "border-[#d5deea] bg-[#f4f8fc] text-[#18202f] focus:border-[#18a957] focus:ring-2 focus:ring-[#18a957]/15"
              }`}
            />
          ))}
        </div>

        {error && <p className="text-center text-xs text-[#de3d3d]">{error}</p>}

        <button
          type="submit"
          disabled={isVerifying}
          className="mt-1 flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#10a950] text-base font-semibold text-white shadow-[0_10px_24px_rgba(16,169,80,0.3)] transition-all duration-200 hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:bg-[#6fbd93] disabled:shadow-none"
        >
          {isVerifying ? "Verifying..." : "Verify & Continue"}
        </button>

        <div className="space-y-2 text-center text-sm">
          <button
            type="button"
            onClick={() => navigate("/auth/forgot-password")}
            className="font-semibold text-[#18a354] transition-colors hover:text-[#138b46]"
          >
            Change Email Address
          </button>
          <div>
            <button
              type="button"
              onClick={handleResend}
              disabled={timer > 0 || isResending}
              className={`font-semibold transition-colors ${
                timer > 0 || isResending
                  ? isDarkMode
                    ? "cursor-not-allowed text-[#64748b]"
                    : "cursor-not-allowed text-[#9aa7b8]"
                  : "text-[#18a354] hover:text-[#138b46]"
              }`}
            >
              {isResending ? "Resending..." : "Resend OTP"}
            </button>
            <p
              className={`mt-1 text-xs ${
                isDarkMode ? "text-[#94a3b8]" : "text-[#8e97a7]"
              }`}
            >
              {timer > 0 ? `Available in ${timer}s` : "You can resend OTP now"}
            </p>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}

export default VerifyOtp;
