import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import StatusToggle from "../../../components/admin/StatusToggle";
import TableCard from "../../../components/admin/TableCard";
import ViewActionButton from "../../../components/admin/ViewActionButton";
import PermissionDenied from "../../../components/admin/PermissionDenied";
import { toastApiError } from "../../../services/toast/apiToast";
import { isPartnerLoginRole } from "../../../services/auth/loginRole";
import { getSessionPartnerId } from "../../../services/auth/sessionIdentity";
import {
  listSupplierMappings,
  mapSupplierMappingToRow,
} from "../services/supplierMappingApi";

function PartnerProjectsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const partnerId = getSessionPartnerId();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!isPartnerLoginRole()) {
      setRows([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setErrorMessage("");
    listSupplierMappings()
      .then((records) => {
        if (cancelled) return;
        const mapped = (Array.isArray(records) ? records : []).map((record, index) =>
          mapSupplierMappingToRow(record, index)
        );
        const scoped = partnerId
          ? mapped.filter((row) => !row.partnerId || String(row.partnerId) === String(partnerId))
          : mapped;
        setRows(scoped);
      })
      .catch((error) => {
        if (cancelled) return;
        toastApiError(error);
        setErrorMessage(error?.message || "Unable to load assigned projects.");
        setRows([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [partnerId]);

  if (!isPartnerLoginRole()) {
    return <PermissionDenied isDarkMode={isDarkMode} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Projects"
        subtitle="Assigned projects for your partner account."
        isDarkMode={isDarkMode}
      />
      <TableCard isDarkMode={isDarkMode}>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-full text-sm">
            <thead>
              <tr className="admin-text-muted">
                {[
                  "Project",
                  "Partner Code",
                  "Partner Quota",
                  "CPI",
                  "Partner URL",
                  "Status",
                  "Action",
                ].map((label) => (
                  <th
                    key={label}
                    className={`px-3 py-3 text-xs font-semibold ${
                      label === "Action" ? "admin-table-actions-col text-center" : "text-left"
                    }`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="admin-text-muted px-3 py-10 text-center">
                    Loading...
                  </td>
                </tr>
              ) : errorMessage ? (
                <tr>
                  <td colSpan={7} className="admin-text-muted px-3 py-10 text-center">
                    {errorMessage}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-text-muted px-3 py-10 text-center">
                    No assigned projects found
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const projectId = row.projectId || row.record?.projectid;
                  return (
                    <tr key={row.id || `${projectId}-${row.partnerCode}`}>
                      <td className="admin-text whitespace-nowrap px-3 py-3">
                        {row.projectName || projectId || "—"}
                      </td>
                      <td className="admin-text whitespace-nowrap px-3 py-3">
                        {row.partnerCode}
                      </td>
                      <td className="admin-text whitespace-nowrap px-3 py-3">{row.quota}</td>
                      <td className="admin-text whitespace-nowrap px-3 py-3">{row.cpi}</td>
                      <td className="admin-text max-w-[220px] truncate px-3 py-3">
                        {row.partnerUrl || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <StatusToggle checked={Boolean(row.statusActive)} readOnly compact />
                      </td>
                      <td className="admin-table-actions-col px-3 py-3 text-center">
                        <ViewActionButton
                          iconOnly
                          label="View"
                          onView={
                            projectId
                              ? () =>
                                  navigate(`/survey/view/${encodeURIComponent(projectId)}`)
                              : undefined
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </TableCard>
    </div>
  );
}

export default PartnerProjectsPage;
