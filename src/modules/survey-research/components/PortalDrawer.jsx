import { X } from "lucide-react";
import { Link } from "react-router-dom";
import PortalStatusBadge from "./PortalStatusBadge";

function PortalDrawer({ isOpen, group, onClose }) {
  if (!isOpen || !group) return null;

  return (
    <>
      <button type="button" className="srp-drawer-overlay" aria-label="Close details" onClick={onClose} />
      <aside className="srp-drawer-panel" role="dialog" aria-modal="true" aria-label="Group details">
        <div
          className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: "var(--srp-border)", background: "var(--srp-surface)" }}
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.02em]" style={{ color: "var(--srp-text-muted)" }}>
              Pre-Screener Group
            </p>
            <h2 className="mt-1 text-lg font-semibold">{group.questionnaireTitle}</h2>
          </div>
          <button type="button" className="srp-btn-ghost !p-2" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold tracking-[0.02em]" style={{ color: "var(--srp-text-muted)" }}>
                Group Name
              </dt>
              <dd className="mt-1 text-sm font-medium">{group.groupName}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-[0.02em]" style={{ color: "var(--srp-text-muted)" }}>
                Language
              </dt>
              <dd className="mt-1 text-sm font-medium">{group.language}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-[0.02em]" style={{ color: "var(--srp-text-muted)" }}>
                Total Questions
              </dt>
              <dd className="mt-1 text-sm font-medium">{group.totalQuestions}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-[0.02em]" style={{ color: "var(--srp-text-muted)" }}>
                Created By
              </dt>
              <dd className="mt-1 text-sm font-medium">{group.createdBy}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-[0.02em]" style={{ color: "var(--srp-text-muted)" }}>
                Created Date
              </dt>
              <dd className="mt-1 text-sm font-medium">{group.createdDate}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-[0.02em]" style={{ color: "var(--srp-text-muted)" }}>
                Status
              </dt>
              <dd className="mt-1">
                <PortalStatusBadge status={group.status} />
              </dd>
            </div>
          </dl>

          <section
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--srp-border)", background: "var(--srp-surface-muted)" }}
          >
            <h3 className="text-sm font-semibold">Questionnaire Preview Link</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--srp-text-muted)" }}>
              Open the configured questionnaire exactly as panelists will see it.
            </p>
            <Link
              to={group.previewUrl}
              className="srp-btn-primary mt-4"
              onClick={onClose}
            >
              Open Questionnaire Preview
            </Link>
          </section>
        </div>
      </aside>
    </>
  );
}

export default PortalDrawer;
