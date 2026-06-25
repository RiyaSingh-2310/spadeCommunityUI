import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { getRecontactSupplierDetails } from "../services/recontactSurveyApi";
import { toastApiError } from "../../../services/toast/apiToast";

const SUPPLIER_COLUMNS = [
  "S.No",
  "Supplier Code",
  "Supplier Name",
  "Total Respondent",
  "Complete",
  "Terminate",
  "Over Quota",
  "Quality Term",
  "Dropout",
];

const TABLE_HEAD =
  "admin-text-muted px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap";

function renderSupplierCell(row, col) {
  const map = {
    "S.No": row.sno,
    "Supplier Code": row.supplierCode,
    "Supplier Name": row.supplierName,
    "Total Respondent": row.totalRespondent,
    Complete: row.complete,
    Terminate: row.terminate,
    "Over Quota": row.overQuota,
    "Quality Term": row.qualityTerm,
    Dropout: row.dropout,
  };
  return map[col] ?? "—";
}

function RecontactSupplierDetailsModal({ isOpen, onClose, surveyId }) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !surveyId) {
      setRows([]);
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);

    getRecontactSupplierDetails(surveyId)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((error) => {
        if (!cancelled) {
          toastApiError(error);
          setRows([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, surveyId]);

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className="admin-header-overlay absolute inset-0"
        aria-label="Close supplier details"
        onClick={onClose}
      />
      <div
        className="admin-header-surface relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recontact-supplier-details-title"
      >
        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--admin-header-surface-border)" }}
        >
          <h2 id="recontact-supplier-details-title" className="admin-text text-lg font-bold">
            Supplier Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="admin-icon-btn admin-text-subtle flex h-8 w-8 items-center justify-center rounded-lg"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="animate-spin text-[var(--admin-success-text)]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table min-w-full text-sm">
                <thead>
                  <tr>
                    {SUPPLIER_COLUMNS.map((col) => (
                      <th key={col} className={TABLE_HEAD}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={SUPPLIER_COLUMNS.length}
                        className="admin-text-muted px-3 py-8 text-center text-sm"
                      >
                        No supplier details found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, rowIdx) => (
                      <tr
                        key={row.supplierCode ?? rowIdx}
                        className="border-t align-middle"
                        style={{ borderColor: "var(--admin-header-surface-border)" }}
                      >
                        {SUPPLIER_COLUMNS.map((col) => (
                          <td key={col} className="admin-text px-3 py-3 align-middle text-sm">
                            {renderSupplierCell(row, col)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecontactSupplierDetailsModal;
