import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  sendPartnerUrlOtp,
  verifyPartnerUrlOtp,
} from "../services/partnerUrlOtpApi";

function PartnerUrlOtpVerificationModal({
  isOpen,
  onClose,
  partnerUrl,
  mappingId,
  onVerified,
}) {
  const inputClass = getAdminInputClass();

  const [step, setStep] = useState(1); // 1: email, 2: otp
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const canSend = useMemo(
    () => identifier.trim().length > 0 && !isSending && !isResending,
    [identifier, isSending, isResending]
  );

  const isBusy = isSending || isVerifying || isResending;

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setIdentifier("");
    setOtp("");
    setError("");
    setIsSending(false);
    setIsVerifying(false);
    setIsResending(false);
  }, [isOpen]);

  const validateIdentifier = (value) => {
    const normalized = String(value ?? "").trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
    const isValidUid = /^[0-9]{3,}$/.test(normalized);
    if (!normalized || (!isValidEmail && !isValidUid)) return "Invalid Email ID or UID";
    return "";
  };

  const handleContinue = async () => {
    setError("");
    const clientError = validateIdentifier(identifier);
    if (clientError) {
      setError(clientError);
      return;
    }

    setIsSending(true);
    try {
      const resp = await sendPartnerUrlOtp({
        identifier: identifier.trim(),
        mappingId,
        partnerUrl,
      });
      toastApiSuccess(resp);
      setStep(2);
      setOtp("");
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid Credentials";
      setError(message || "Invalid Credentials");
      toastApiError(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleBackToEmail = () => {
    if (isBusy) return;
    setStep(1);
    setOtp("");
    setError("");
    // Keep entered email/UID for the previous screen.
  };

  const handleVerifyOtp = async (event) => {
    event?.preventDefault?.();
    setError("");

    setIsVerifying(true);
    try {
      await verifyPartnerUrlOtp({
        identifier: identifier.trim(),
        otp: otp.trim(),
        mappingId,
        partnerUrl,
      });

      onVerified?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid OTP. Please try again.";
      setError(message || "Invalid OTP. Please try again.");
      toastApiError(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setError("");
    if (isResending || isSending) return;

    const clientError = validateIdentifier(identifier);
    if (clientError) {
      setError(clientError);
      return;
    }

    setIsResending(true);
    try {
      const resp = await sendPartnerUrlOtp({
        identifier: identifier.trim(),
        mappingId,
        partnerUrl,
      });
      toastApiSuccess(resp);
      setOtp("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid Credentials";
      setError(message || "Invalid Credentials");
      toastApiError(err);
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="admin-header-overlay absolute inset-0" aria-hidden />

      <div
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
                onClick={onClose}
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
              {error ? (
                <p
                  className="admin-text mt-0.5 text-sm"
                  style={{ color: "var(--admin-danger-text)" }}
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
                    disabled={isVerifying || otp.trim().length !== 6}
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
