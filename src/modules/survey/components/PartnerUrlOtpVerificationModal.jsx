import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { toastApiError, toastApiInfo, toastApiSuccess } from "../../../services/toast/apiToast";
import { sendPartnerUrlOtp, verifyPartnerUrlOtp } from "../services/partnerUrlOtpApi";

function PartnerUrlOtpVerificationModal({
  isOpen,
  onCancel,
  partnerUrl,
  mappingId,
  sessionStorageKey,
  onVerified,
}) {
  const inputClass = getAdminInputClass();

  const [step, setStep] = useState(1); // 1: identity, 2: otp
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const canSend = useMemo(() => identifier.trim().length > 0 && !isSending && !isResending, [
    identifier,
    isSending,
    isResending,
  ]);

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

  const validateIdentifierForMock = (value) => {
    const normalized = String(value ?? "").trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
    const isValidUid = /^[0-9]{3,}$/.test(normalized);
    if (!normalized || (!isValidEmail && !isValidUid)) return "Invalid Email ID or UID";
    return "";
  };

  const handleContinue = async () => {
    setError("");
    const clientError = validateIdentifierForMock(identifier);
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

      // Mock-only: show OTP so UI can be tested before backend wiring.
      if (resp?.mockOtp) {
        toastApiInfo(`Mock OTP sent: ${resp.mockOtp}`);
      }
      toastApiSuccess(resp);
      setStep(2);
      setOtp("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid Credentials";
      setError(message || "Invalid Credentials");
      toastApiError(err);
    } finally {
      setIsSending(false);
    }
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

      if (sessionStorageKey) {
        sessionStorage.setItem(sessionStorageKey, "1");
      }
      onVerified?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid Credentials";
      setError(message || "Invalid Credentials");
      toastApiError(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setError("");
    if (isResending || isSending) return;

    const clientError = validateIdentifierForMock(identifier);
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
      if (resp?.mockOtp) {
        toastApiInfo(`Mock OTP resent: ${resp.mockOtp}`);
      }
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
      <button
        type="button"
        className="admin-header-overlay absolute inset-0 cursor-pointer"
        aria-label="Close OTP verification"
        onClick={onCancel}
        disabled={isSending || isVerifying || isResending}
      />

      <div
        className="admin-header-surface admin-modal-panel relative z-10 w-full max-w-md rounded-2xl border p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {step === 1 ? (
          <>
            <h2 className="admin-text mb-2 text-lg font-semibold">Verify Your Identity</h2>
            <p className="admin-text-muted mb-4 text-sm">
              Enter your email ID or UID to receive an OTP.
            </p>

            <div className="space-y-4">
              <label className="admin-text-muted text-xs font-semibold uppercase tracking-wide" htmlFor="partner-url-identifier">
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
                <p className="admin-text mt-0.5 text-sm" style={{ color: "var(--admin-danger-text)" }}>
                  {error}
                </p>
              ) : null}
            </div>

            <div className="admin-modal-actions mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSending || isResending}
                className={getAdminCancelButtonClass("modal")}
              >
                Cancel
              </button>
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
            <h2 className="admin-text mb-2 text-lg font-semibold">Verify OTP</h2>
            <p className="admin-text-muted mb-4 text-sm">
              Enter the OTP sent to your email/UID.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <label className="admin-text-muted text-xs font-semibold uppercase tracking-wide" htmlFor="partner-url-otp">
                OTP
              </label>
              <input
                id="partner-url-otp"
                className={`${inputClass} text-center`}
                placeholder="Enter OTP"
                inputMode="numeric"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setError("");
                }}
                disabled={isVerifying}
                aria-invalid={Boolean(error)}
                maxLength={6}
              />
              {error ? (
                <p className="admin-text mt-0.5 text-sm" style={{ color: "var(--admin-danger-text)" }}>
                  {error}
                </p>
              ) : null}

              <div className="admin-modal-actions flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isSending || isResending || isVerifying}
                  className={getAdminCancelButtonClass("modal")}
                >
                  {isResending ? <Loader2 size={16} className="animate-spin" /> : null}
                  Resend OTP
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || otp.trim().length !== 6}
                  className="admin-btn-primary inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isVerifying ? <Loader2 size={16} className="animate-spin" /> : null}
                  Verify OTP
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default PartnerUrlOtpVerificationModal;

