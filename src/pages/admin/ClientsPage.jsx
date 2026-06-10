import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../modules/shared/components/ModuleListingPage";
import { useFlashMessage } from "../../modules/shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../modules/shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../services/toast/apiToast";
import {
  deleteRecord,
  getRecords,
  updateClientStatus,
} from "../../services/clients/clientsApi";

const LIST_COLUMNS = [
  "S.No",
  "Client Code",
  "Name",
  "Email Address",
  "Country",
  "Contact Number",
  "Website URL",
  "Status",
  "Action",
];

function ClientsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  useFlashMessage();
  const [clients, setClients] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRecords();
      setClients(data.items);
      setTotalRecords(data.total ?? data.count ?? data.items.length);
    } catch (error) {
      toastApiError(error);
      setClients([]);
      setTotalRecords(0);
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

  const handleDeleteRequest = (row) => {
    setDeleteTarget(row);
  };

  const handleDeleteCancel = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.id) return;

    setIsDeleting(true);
    try {
      const data = await deleteRecord(deleteTarget.id);
      setDeleteTarget(null);
      toastApiSuccess(data);
      await fetchClients();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async (row) => {
    if (!row?.id || statusUpdatingId != null) return;

    const nextStatus = row.status === "Active" ? "Inactive" : "Active";
    const previousStatus = row.status;
    setStatusUpdatingId(row.id);

    try {
      const data = await updateClientStatus(row.id, {
        name: row.name,
        status: nextStatus,
        country: row.countryValue ?? row.country,
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
        editPath="/clients"
        onDelete={handleDeleteRequest}
        searchFields={[
          "name",
          "emailAddress",
          "country",
          "contactNumber",
          "clientCode",
        ]}
        isLoading={isLoading}
        emptyMessage="No clients found"
        onStatusToggle={handleStatusToggle}
        permissionModule="clients"
        nameAsText
        totalRecords={totalRecords}
        pageSize={DEFAULT_PAGE_SIZE}
        showPagination
        nowrapAllCells
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default ClientsPage;
