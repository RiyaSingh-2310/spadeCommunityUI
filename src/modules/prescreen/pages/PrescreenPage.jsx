import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import {
  deleteRecord,
  getRecords,
  updatePrescreenStatus,
} from "../../../services/prescreen/prescreenQuestionnairesApi";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

const LIST_COLUMNS = ["S.No", "Title", "Language", "Right Answer", "Status", "Action"];

function PrescreenPage({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  useFlashMessage();
  const [rows, setRows] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const fetchPrescreens = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRecords();
      setRows(data.items);
      setTotalRecords(data.total ?? data.count ?? data.items.length);
    } catch (error) {
      toastApiError(error);
      setRows([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescreens();
  }, [fetchPrescreens]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchPrescreens();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, fetchPrescreens]);

  const handleEdit = (row) => {
    if (!row?.id) return;
    navigate(`/prescreen/edit/${encodeURIComponent(row.id)}`);
  };

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
      await fetchPrescreens();
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
      const data = await updatePrescreenStatus(row.id, {
        title: row.title,
        language: row.language,
        rightAnswer: row.rightAnswer,
        options: row.options,
        status: nextStatus,
      });
      setRows((prev) =>
        prev.map((item) =>
          String(item.id) === String(row.id) ? { ...item, status: nextStatus } : item
        )
      );
      toastApiSuccess(data);
    } catch (error) {
      toastApiError(error);
      setRows((prev) =>
        prev.map((item) =>
          String(item.id) === String(row.id) ? { ...item, status: previousStatus } : item
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
        title="Prescreen"
        searchPlaceholder="Search prescreens..."
        actionLabel="Add Prescreen"
        onActionClick={() => navigate("/prescreen/add")}
        columns={LIST_COLUMNS}
        rows={rows}
        rowIdKey="id"
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onStatusToggle={handleStatusToggle}
        permissionModule="prescreen"
        searchFields={["title", "language", "rightAnswer"]}
        isLoading={isLoading}
        emptyMessage="No prescreens found"
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

export default PrescreenPage;
