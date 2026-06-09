import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ModuleListingPage from "../../modules/shared/components/ModuleListingPage";
import { useFlashMessage } from "../../modules/shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../modules/shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../services/toast/apiToast";
import { getRecords, updateClientStatus } from "../../services/clients/clientsApi";

const LIST_COLUMNS = [
  "S.No",
  "Client Code",
  "Name",
  "Email Address",
  "Country",
  "Contact Number",
  "Website URL",
  "Status",
];

function ClientsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  useFlashMessage();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRecords();
      setClients(data.items);
    } catch (error) {
      toastApiError(error);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchClients();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, fetchClients]);

  const handleStatusToggle = async (row) => {
    if (!row?.id || statusUpdatingId != null) return;

    const nextStatus = row.status === "Active" ? "Inactive" : "Active";
    const previousStatus = row.status;
    setStatusUpdatingId(row.id);

    try {
      const data = await updateClientStatus(row.id, {
        name: row.name,
        status: nextStatus,
        country: row.country,
        contactNumber: row.contactNumber,
      });
      setClients((prev) =>
        prev.map((item) =>
          String(item.id) === String(row.id) ? { ...item, status: nextStatus } : item
        )
      );
      toastApiSuccess(data);
    } catch (error) {
      toastApiError(error);
      setClients((prev) =>
        prev.map((item) =>
          String(item.id) === String(row.id)
            ? { ...item, status: previousStatus }
            : item
        )
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Client List"
        searchPlaceholder="Search clients..."
        actionLabel="Add Client User"
        onActionClick={() => navigate("/clients/add")}
        columns={LIST_COLUMNS}
        rows={clients}
        rowIdKey="id"
        searchFields={[
          "name",
          "emailAddress",
          "country",
          "contactNumber",
          "clientCode",
        ]}
        isLoading={isLoading}
        loadingMessage="Loading clients..."
        emptyMessage="No clients found"
        onStatusToggle={handleStatusToggle}
        permissionModule="clients"
        pageSize={DEFAULT_PAGE_SIZE}
        showPagination
        nowrapAllCells
      />
    </div>
  );
}

export default ClientsPage;
