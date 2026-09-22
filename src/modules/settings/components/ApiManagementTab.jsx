import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import AdminPagination from "../../../components/admin/AdminPagination";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import PermissionDenied from "../../../components/admin/PermissionDenied";
import TableCard from "../../../components/admin/TableCard";
import TableEllipsisText from "../../../components/admin/TableEllipsisText";
import { getAdminUser } from "../../../services/auth/authStorage";
import { isAdminLoginRole } from "../../../services/auth/loginRole";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { API_MANAGEMENT_TABLE_COLUMNS } from "../constants/apiManagement";
import {
  createApiKey,
  deleteApiKey,
  fetchApiKeyById,
  fetchApiKeysList,
  updateApiKey,
} from "../services/apiKeysApi";
import ApiManagementFormModal from "./ApiManagementFormModal";
import ApiManagementViewModal from "./ApiManagementViewModal";

function canManageApis() {
  if (!isAdminLoginRole()) return false;
  return Boolean(getAdminUser()?.id);
}

function ApiManagementTab({ isDarkMode, showTitle = true }) {
  const allowed = canManageApis();
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [formMode, setFormMode] = useState(null); // "add" | "edit" | null
  const [activeRecord, setActiveRecord] = useState(null);
  const [editTargetId, setEditTargetId] = useState(null);
  const [isLoadingFormRecord, setIsLoadingFormRecord] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [viewError, setViewError] = useState("");
  const [viewTargetId, setViewTargetId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    setListError("");
    try {
      const result = await fetchApiKeysList({ page, limit: pageSize });
      if (result.items.length === 0 && page > 1 && result.total > 0) {
        setPage((prev) => Math.max(1, prev - 1));
        return;
      }
      setRecords(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      setRecords([]);
      setTotal(0);
      setTotalPages(1);
      setListError(error?.message || "Unable to load API configurations.");
      toastApiError(error);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    if (!allowed) return;
    loadRecords();
  }, [allowed, loadRecords]);

  if (!allowed) {
    return <PermissionDenied isDarkMode={isDarkMode} />;
  }

  const openAdd = () => {
    setEditTargetId(null);
    setActiveRecord(null);
    setIsLoadingFormRecord(false);
    setFormMode("add");
  };

  const openEdit = async (record) => {
    if (!record?.id) return;
    setFormMode("edit");
    setEditTargetId(record.id);
    setActiveRecord(null);
    setIsLoadingFormRecord(true);
    try {
      const detail = await fetchApiKeyById(record.id);
      setActiveRecord(detail);
    } catch (error) {
      toastApiError(error);
      setFormMode(null);
      setEditTargetId(null);
      setActiveRecord(null);
    } finally {
      setIsLoadingFormRecord(false);
    }
  };

  const closeForm = () => {
    if (isSaving || isLoadingFormRecord) return;
    setFormMode(null);
    setActiveRecord(null);
    setEditTargetId(null);
    setIsLoadingFormRecord(false);
  };

  const openView = async (record) => {
    if (!record?.id) return;
    setViewTargetId(record.id);
    setViewRecord(null);
    setViewError("");
    setIsLoadingView(true);
    try {
      const detail = await fetchApiKeyById(record.id);
      setViewRecord(detail);
    } catch (error) {
      setViewError(error?.message || "Unable to load API configuration.");
      toastApiError(error);
    } finally {
      setIsLoadingView(false);
    }
  };

  const closeView = () => {
    if (isLoadingView) return;
    setViewRecord(null);
    setViewTargetId(null);
    setViewError("");
  };

  const retryView = () => {
    if (viewTargetId == null) return;
    openView({ id: viewTargetId });
  };

  const handleFormSubmit = async (formValues, { mode }) => {
    if (isSaving) return;
    const targetId = activeRecord?.id ?? editTargetId;
    setIsSaving(true);
    try {
      if (mode === "edit" && targetId != null) {
        const data = await updateApiKey(targetId, formValues);
        toastApiSuccess(data, "API configuration updated successfully.");
        setFormMode(null);
        setActiveRecord(null);
        setEditTargetId(null);
        await loadRecords();
      } else {
        const data = await createApiKey(formValues);
        toastApiSuccess(data, "API configuration created successfully.");
        setFormMode(null);
        setActiveRecord(null);
        setEditTargetId(null);
        if (page !== 1) {
          setPage(1);
        } else {
          await loadRecords();
        }
      }
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id || isDeleting) return;
    setIsDeleting(true);
    try {
      const data = await deleteApiKey(deleteTarget.id);
      setDeleteTarget(null);
      toastApiSuccess(data, "API configuration deleted successfully.");
      await loadRecords();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
  };

  const handlePageSizeChange = (nextSize) => {
    setPageSize(nextSize);
    setPage(1);
  };

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={loadRecords}
        disabled={isLoading || isSaving}
        className="admin-btn-cancel inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        title="Refresh"
      >
        <RefreshCw size={16} className={isLoading ? "animate-spin" : undefined} />
        Refresh
      </button>
      <button
        type="button"
        onClick={openAdd}
        disabled={isLoading || isSaving}
        className="admin-btn-primary inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={16} />
        Add API
      </button>
    </div>
  );

  const cardTitle = showTitle ? "API Key Management" : null;
  const showTable = !isLoading && !listError && records.length > 0;
  const showEmpty = !isLoading && !listError && records.length === 0;

  return (
    <>
      <TableCard
        title={cardTitle}
        isDarkMode={isDarkMode}
        flush={showTable}
        headerAction={headerActions}
      >
        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <Loader2
              size={28}
              className="animate-spin text-[var(--admin-primary-color)]"
            />
          </div>
        ) : listError ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <p className="admin-text text-sm font-semibold">
              Unable to load API configurations
            </p>
            <p className="admin-text-muted max-w-md text-sm">{listError}</p>
            <button
              type="button"
              onClick={loadRecords}
              className="admin-btn-primary inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        ) : showEmpty ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <p className="admin-text text-sm font-semibold">
              No API configurations found
            </p>
            <p className="admin-text-muted max-w-md text-sm">
              Add an API configuration to manage external API credentials and
              request settings.
            </p>
            <button
              type="button"
              onClick={openAdd}
              className="admin-btn-primary inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold"
            >
              <Plus size={16} />
              Add API
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="admin-table min-w-full text-sm">
                <thead>
                  <tr className="admin-text-muted">
                    {API_MANAGEMENT_TABLE_COLUMNS.map((heading) => (
                      <th
                        key={heading}
                        className={`px-4 py-3 text-xs font-semibold tracking-[0.02em] whitespace-nowrap ${
                          heading === "Actions" ? "text-right" : "text-left"
                        }`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-[var(--admin-table-border)]"
                    >
                      <td className="admin-table-ellipsis-cell max-w-[140px] px-4 py-3 align-middle">
                        <TableEllipsisText>{row.apiName}</TableEllipsisText>
                      </td>
                      <td className="admin-table-ellipsis-cell max-w-[180px] px-4 py-3 align-middle">
                        <TableEllipsisText>{row.apiLabel}</TableEllipsisText>
                      </td>
                      <td className="admin-table-ellipsis-cell max-w-[120px] px-4 py-3 align-middle">
                        <TableEllipsisText>{row.apiUserId}</TableEllipsisText>
                      </td>
                      <td className="admin-text whitespace-nowrap px-4 py-3 font-mono text-xs">
                        {row.apiKeyDisplay}
                      </td>
                      <td className="admin-table-ellipsis-cell max-w-[180px] px-4 py-3 align-middle">
                        <TableEllipsisText>{row.baseUrl}</TableEllipsisText>
                      </td>
                      <td className="admin-table-ellipsis-cell max-w-[120px] px-4 py-3 align-middle">
                        <TableEllipsisText>{row.endpoint}</TableEllipsisText>
                      </td>
                      <td className="admin-text whitespace-nowrap px-4 py-3">
                        {row.method}
                      </td>
                      <td className="admin-text whitespace-nowrap px-4 py-3">
                        {row.authType}
                      </td>
                      <td className="admin-text whitespace-nowrap px-4 py-3">
                        {row.statusLabel ?? row.status}
                      </td>
                      <td className="admin-text whitespace-nowrap px-4 py-3">
                        {row.createdAtLabel}
                      </td>
                      <td className="admin-text whitespace-nowrap px-4 py-3">
                        {row.updatedAtLabel}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openView(row)}
                            className="admin-icon-action"
                            aria-label="View"
                            title="View"
                          >
                            <Eye size={16} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="admin-icon-action"
                            aria-label="Edit"
                            title="Edit"
                          >
                            <Pencil size={16} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(row)}
                            className="admin-icon-action admin-icon-action--danger"
                            aria-label="Delete"
                            title="Delete"
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <AdminPagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </>
        )}
      </TableCard>

      <ApiManagementFormModal
        isOpen={formMode === "add" || formMode === "edit"}
        mode={formMode === "edit" ? "edit" : "add"}
        record={activeRecord}
        isLoadingRecord={formMode === "edit" && isLoadingFormRecord}
        isDarkMode={isDarkMode}
        isSubmitting={isSaving}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
      />

      <ApiManagementViewModal
        isOpen={viewTargetId != null}
        record={viewRecord}
        isLoading={isLoadingView}
        errorMessage={viewError}
        onRetry={retryView}
        onClose={closeView}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete API Configuration"
        message={`Are you sure you want to delete "${deleteTarget?.apiName ?? "this API"}"${
          deleteTarget?.apiLabel ? ` (${deleteTarget.apiLabel})` : ""
        }? This cannot be undone.`}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}

export default ApiManagementTab;
