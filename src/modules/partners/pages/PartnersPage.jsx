import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  deleteRecord,
  getRecords,
  updatePartnerStatus,
} from "../../../services/partners/partnersApi";

const LIST_COLUMNS = [
  "S.No",
  "Partner Code",
  "Name",
  "Email Address",
  "Country",
  "Contact Number",
  "Website URL",
  "Created Date",
  "Status",
  "Action",
];

function PartnersPage({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  useFlashMessage();
  const [partners, setPartners] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRecords();
      setPartners(data.items);
      setTotalRecords(data.total ?? data.count ?? data.items.length);
    } catch (error) {
      toastApiError(error);
      setPartners([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchPartners();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, fetchPartners]);

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
      await fetchPartners();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async (row) => {
    if (!row?.id || statusUpdatingId != null) return;

    const nextStatus = row.status === "Active" ? "Inactive" : "Active";
    setStatusUpdatingId(row.id);

    try {
      const data = await updatePartnerStatus(row.id, {
        name: row.name,
        status: nextStatus,
      });
      toastApiSuccess(data);
      await fetchPartners();
    } catch (error) {
      toastApiError(error);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Partners"
        searchPlaceholder="Search partners..."
        actionLabel="Add Partner"
        onActionClick={() => navigate("/partners/add")}
        columns={LIST_COLUMNS}
        rows={partners}
        rowIdKey="id"
        editPath="/partners"
        permissionModule="partners"
        searchFields={[
          "partnerCode",
          "name",
          "emailAddress",
          "country",
          "contactNumber",
          "websiteUrl",
          "createdDate",
        ]}
        isLoading={isLoading}
        loadingMessage="Loading partners..."
        emptyMessage="No partners found"
        onDelete={handleDeleteRequest}
        onStatusToggle={handleStatusToggle}
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

export default PartnersPage;
