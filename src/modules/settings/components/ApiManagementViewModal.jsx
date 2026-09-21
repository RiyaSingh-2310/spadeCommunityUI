import { getAdminCancelButtonClass } from "../../shared/utils/formStyles";
import { maskApiSecret } from "../constants/apiManagement";

function DetailItem({ label, value, fullWidth = false }) {
  return (
    <div className={`min-w-0 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <dt className="admin-text-muted text-xs font-medium">{label}</dt>
      <dd className="admin-text mt-0.5 break-words text-sm whitespace-pre-wrap">
        {value == null || String(value).trim() === "" ? "—" : String(value)}
      </dd>
    </div>
  );
}

function ApiManagementViewModal({ isOpen, record, onClose }) {
  if (!isOpen || !record) return null;

  return (
    <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className="admin-header-overlay absolute inset-0 cursor-pointer"
        aria-label="Close API details"
        onClick={onClose}
      />
      <div
        className="admin-header-surface admin-modal-panel relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-management-view-title"
      >
        <div className="border-b border-[var(--admin-table-border)] px-5 py-4">
          <h2
            id="api-management-view-title"
            className="admin-text text-lg font-semibold"
          >
            API Details
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="API Name" value={record.apiName} />
            <DetailItem label="API Label" value={record.apiLabel} />
            <DetailItem label="API User ID" value={record.apiUserId} />
            <DetailItem label="API Key" value={maskApiSecret(record.apiKey)} />
            <DetailItem label="Base URL" value={record.baseUrl} fullWidth />
            <DetailItem label="Endpoint" value={record.endpoint} />
            <DetailItem label="Method" value={record.method} />
            <DetailItem label="Auth Type" value={record.authType} />
            <DetailItem label="Header Name" value={record.headerName} />
            <DetailItem
              label="Status"
              value={record.statusLabel ?? record.status}
            />
            <DetailItem
              label="Description"
              value={record.description}
              fullWidth
            />
          </dl>
        </div>

        <div className="flex justify-end border-t border-[var(--admin-table-border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className={getAdminCancelButtonClass("modal")}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApiManagementViewModal;
