import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../modules/shared/components/ModuleListingPage";
import { useFlashMessage } from "../../modules/shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../modules/shared/utils/pagination";
import { toastApiError } from "../../services/toast/apiToast";
import { getRecords } from "../../services/clients/clientsApi";

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
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteRequest = (row) => {
    setDeleteTarget(row);
  };

  const handleDeleteCancel = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget?.id) return;

    setIsDeleting(true);
    try {
      const id = deleteTarget.id;
      setClients((prev) =>
        prev.filter((item) => String(item.id) !== String(id))
      );
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = (row) => {
    const id = row.id;
    setClients((prev) =>
      prev.map((item) =>
        String(item.id) === String(id)
          ? {
              ...item,
              status:
                String(item.status).toLowerCase() === "active"
                  ? "Inactive"
                  : "Active",
            }
          : item
      )
    );
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
        actionVariant="view-edit"
        editPath="/clients"
        onView={(row) => navigate(`/clients/edit/${row.id}`)}
        onEdit={(row) => navigate(`/clients/edit/${row.id}`)}
        onDelete={handleDeleteRequest}
        onStatusToggle={handleStatusToggle}
        permissionModule="clients"
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
