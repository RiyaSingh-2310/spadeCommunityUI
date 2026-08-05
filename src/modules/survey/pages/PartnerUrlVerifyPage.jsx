import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import TableCard from "../../../components/admin/TableCard";
import { appendIsTestToPartnerUrl } from "../services/supplierMappingApi";
import PartnerUrlOtpVerificationModal from "../components/PartnerUrlOtpVerificationModal";

function getOtpSessionKey(mappingId) {
  return mappingId ? `partnerUrlOtpVerified:${String(mappingId)}` : "";
}

/**
 * Destination page for Partner URL clicks.
 * Shows Verify Your Email modal before unlocking / opening survey content.
 */
function PartnerUrlVerifyPage({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state && typeof location.state === "object" ? location.state : {};

  const mappingId = state.mappingId ?? null;
  const isTest = Boolean(state.isTest);
  const returnPath = String(state.returnPath ?? "").trim();
  const rawPartnerUrl = String(state.partnerUrl ?? "").trim();

  const partnerUrl = useMemo(
    () => (rawPartnerUrl ? appendIsTestToPartnerUrl(rawPartnerUrl, isTest) : ""),
    [rawPartnerUrl, isTest]
  );

  const sessionKey = getOtpSessionKey(mappingId);
  const [isVerified, setIsVerified] = useState(() =>
    Boolean(sessionKey && sessionStorage.getItem(sessionKey) === "1")
  );
  const [showModal, setShowModal] = useState(false);

  const goBack = () => {
    if (returnPath) {
      navigate(returnPath);
      return;
    }
    navigate(-1);
  };

  useEffect(() => {
    if (!partnerUrl) return;

    if (sessionKey && sessionStorage.getItem(sessionKey) === "1") {
      setIsVerified(true);
      window.location.assign(partnerUrl);
      return;
    }

    setShowModal(true);
  }, [partnerUrl, sessionKey]);

  const handleVerified = () => {
    if (sessionKey) {
      sessionStorage.setItem(sessionKey, "1");
    }
    setIsVerified(true);
    setShowModal(false);
    if (partnerUrl) {
      window.location.assign(partnerUrl);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    goBack();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Partner URL"
        breadcrumbs={[
          { label: "Survey", to: "/survey" },
          { label: "Partner URL Verification" },
        ]}
        isDarkMode={isDarkMode}
      />

      {!partnerUrl ? (
        <TableCard isDarkMode={isDarkMode}>
          <div className="p-6">
            <p className="admin-text-muted text-sm">
              Partner URL is missing. Go back and open a Partner URL again.
            </p>
            <button
              type="button"
              onClick={goBack}
              className="admin-btn-primary mt-4 inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold"
            >
              Go Back
            </button>
          </div>
        </TableCard>
      ) : (
        <TableCard isDarkMode={isDarkMode}>
          <div className="relative p-6">
            {/* Content stays inaccessible until verification completes */}
            <div
              className={isVerified ? "" : "pointer-events-none select-none blur-sm"}
              aria-hidden={!isVerified}
            >
              <p className="admin-text text-sm font-semibold">Survey content</p>
              <p className="admin-text-muted mt-2 break-all text-sm">{partnerUrl}</p>
              <p className="admin-text-muted mt-4 text-sm">
                {isVerified
                  ? "Verification complete. Opening partner survey…"
                  : "Complete email verification to access this partner survey."}
              </p>
            </div>

            {!isVerified ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[var(--admin-surface-bg)]/70 p-4">
                <p className="admin-text text-center text-sm font-semibold">
                  Verify your email to continue
                </p>
              </div>
            ) : null}
          </div>
        </TableCard>
      )}

      <PartnerUrlOtpVerificationModal
        isOpen={Boolean(partnerUrl) && showModal && !isVerified}
        onCancel={handleCancel}
        partnerUrl={partnerUrl}
        mappingId={mappingId}
        sessionStorageKey={sessionKey}
        onVerified={handleVerified}
      />
    </div>
  );
}

export default PartnerUrlVerifyPage;
