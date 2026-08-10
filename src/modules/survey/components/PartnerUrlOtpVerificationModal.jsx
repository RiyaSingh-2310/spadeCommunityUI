import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  clearSurveyAccessTempToken,
  isSurveyAccessDeniedError,
  isValidEmail,
  readSurveyAccessEmail,
  readSurveyAccessTempToken,
  sendPartnerUrlOtp,
  verifyPartnerUrlOtp,
} from "../services/partnerUrlOtpApi";

/** Brief delay so the error toast can render before the Partner URL tab closes. */
const ACCESS_DENIED_CLOSE_DELAY_MS = 700;

function PartnerUrlOtpVerificationModal({
  isOpen,
  onClose,
  partnerUrl,
  mappingId,
  onVerified,
}) {
  const inputClass = getAdminInputClass();
  const panelRef = useRef(null);
  const identifierRef = useRef(null);
  const otpRef = useRef(null);

  const [step, setStep] = useState(1); // 1: email, 2: otp
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [error, setError] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const emailValid = useMemo(() => isValidEmail(identifier), [identifier]);

  const canSend = useMemo(
    () => emailValid && !isSending && !isResending,
    [emailValid, isSending, isResending]
  );

  const isBusy = isSending || isVerifying || isResending;

  useEffect(() => {
    if (!isOpen) return;
    // Restore in-progress OTP session (tempToken) if the modal remounts mid-flow.
    const storedToken = readSurveyAccessTempToken();
    const storedEmail = readSurveyAccessEmail();
    setStep(storedToken ? 2 : 1);
    setIdentifier(storedEmail || "");
    setTempToken(storedToken || "");
    setOtp("");
    setError("");
    setIsSending(false);
    setIsVerifying(false);
    setIsResending(false);
  }, [isOpen]);

  // Lock background scroll + keep focus inside the modal while open.
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTarget = () => {
      const target = step === 2 ? otpRef.current : identifierRef.current;
      target?.focus?.();
    };
    const focusTimer = window.setTimeout(focusTarget, 0);

    const handleKeyDown = (event) => {
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const nodes = Array.from(focusable).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, step]);

  const validateEmail = (value) => {
    const normalized = String(value ?? "").trim();
    if (!normalized) return "Email is required.";
    if (!isValidEmail(normalized)) return "Please enter a valid email address.";
    return "";
  };

  const handleContinue = async () => {
    setError("");
    const clientError = validateEmail(identifier);
    if (clientError) {
      setError(clientError);
      return;
    }

    setIsSending(true);
    try {
      const resp = await sendPartnerUrlOtp({
        email: identifier.trim(),
        mappingId,
        partnerUrl,
      });
      setTempToken(resp.tempToken || readSurveyAccessTempToken());
      toastApiSuccess(resp);
      setStep(2);
      setOtp("");
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send OTP.";
      setError(message || "Unable to send OTP.");
      toastApiError(err);

      // Unauthorized / no survey access — stop flow, close modal, close Partner URL tab.
      if (isSurveyAccessDeniedError(err)) {
        clearSurveyAccessTempToken();
        setTempToken("");
        window.setTimeout(() => {
          onClose?.();
        }, ACCESS_DENIED_CLOSE_DELAY_MS);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleBackToEmail = () => {
    if (isBusy) return;
    setStep(1);
    setOtp("");
    setError("");
    // Keep email + tempToken until a new OTP is requested or verification succeeds.
  };

  const handleVerifyOtp = async (event) => {
    event?.preventDefault?.();
    setError("");

    const otpText = otp.trim();
    if (!otpText) {
      setError("OTP is required.");
      return;
    }

    const token = tempToken || readSurveyAccessTempToken();
    if (!token) {
      setError("Verification session expired. Please request a new OTP.");
      setStep(1);
      return;
    }

    setIsVerifying(true);
    try {
      const resp = await verifyPartnerUrlOtp({
        otp: otpText,
        tempToken: token,
      });

      toastApiSuccess(resp);
      setTempToken("");
      onVerified?.(resp);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid OTP. Please try again.";
      setError(message || "Invalid OTP. Please try again.");
      toastApiError(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setError("");
    if (isResending || isSending) return;

    const clientError = validateEmail(identifier);
    if (clientError) {
      setError(clientError);
      setStep(1);
      return;
    }

    setIsResending(true);
    try {
      const resp = await sendPartnerUrlOtp({
        email: identifier.trim(),
        mappingId,
        partnerUrl,
      });
      setTempToken(resp.tempToken || readSurveyAccessTempToken());
      toastApiSuccess(resp);
      setOtp("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send OTP.";
      setError(message || "Unable to send OTP.");
      toastApiError(err);

      if (isSurveyAccessDeniedError(err)) {
        clearSurveyAccessTempToken();
        setTempToken("");
        window.setTimeout(() => {
          onClose?.();
        }, ACCESS_DENIED_CLOSE_DELAY_MS);
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    if (isBusy) return;
    clearSurveyAccessTempToken();
    setTempToken("");
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div
        className="admin-header-overlay absolute inset-0 backdrop-blur-md"
        style={{ backgroundColor: "rgba(15, 23, 36, 0.62)" }}
        aria-hidden
      />

      <div
        ref={panelRef}
        className="admin-header-surface admin-modal-panel relative z-10 w-full max-w-md rounded-2xl border p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-url-verify-title"
      >
        {step === 1 ? (
          <>
            <div className="mb-2 flex items-start justify-between gap-3">
              <h2
                id="partner-url-verify-title"
                className="admin-text text-lg font-semibold"
              >
                Verify Your Email
              </h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={isBusy}
                className="admin-icon-btn admin-text-subtle flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X size={18} strokeWidth={2} aria-hidden />
              </button>
            </div>
            <p className="admin-text-muted mb-4 text-sm">
              Enter your email ID or UID to receive an OTP.
            </p>

            <div className="space-y-4">
              <label
                className="admin-text-muted text-xs font-semibold uppercase tracking-wide"
                htmlFor="partner-url-identifier"
              >
                Email ID or UID
              </label>
              <input
                ref={identifierRef}
                id="partner-url-identifier"
                className={inputClass}
                placeholder="Enter Email ID or UID"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError("");
                }}
                disabled={isSending || isResending}
                aria-invalid={Boolean(error)}
              />
              {/* Error is shown via toast; keep inline message for accessibility. */}
              {error ? (
                <p
                  className="admin-text mt-0.5 text-sm"
                  style={{ color: "var(--admin-danger-text)" }}
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </div>

            <div className="admin-modal-actions mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleContinue}
                disabled={!canSend}
                className="admin-btn-primary inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : null}
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <h2
              id="partner-url-verify-title"
              className="admin-text mb-2 text-lg font-semibold"
            >
              Verify OTP
            </h2>
            <p className="admin-text-muted mb-4 text-sm">
              Enter the 6-digit OTP sent to your email/UID.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <label
                className="admin-text-muted text-xs font-semibold uppercase tracking-wide"
                htmlFor="partner-url-otp"
              >
                OTP
              </label>
              <input
                ref={otpRef}
                id="partner-url-otp"
                className={`${inputClass} text-center tracking-[0.2em]`}
                placeholder="Enter OTP"
                inputMode="numeric"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
                disabled={isVerifying}
                aria-invalid={Boolean(error)}
                maxLength={6}
                autoComplete="one-time-code"
              />
              {error ? (
                <p
                  className="admin-text mt-0.5 text-sm"
                  style={{ color: "var(--admin-danger-text)" }}
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <div className="admin-modal-actions flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  disabled={isBusy}
                  className={`${getAdminCancelButtonClass("modal")} inline-flex items-center justify-center gap-1.5`}
                >
                  <ArrowLeft size={16} strokeWidth={2} aria-hidden />
                  Back
                </button>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isBusy}
                    className={getAdminCancelButtonClass("modal")}
                  >
                    {isResending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : null}
                    Resend OTP
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying || otp.trim().length === 0}
                    className="admin-btn-primary inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isVerifying ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : null}
                    Verify
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default PartnerUrlOtpVerificationModal;
