import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import PermissionDenied from "../../../components/admin/PermissionDenied";
import TableCard from "../../../components/admin/TableCard";
import TableEllipsisText from "../../../components/admin/TableEllipsisText";
import { getAdminUser } from "../../../services/auth/authStorage";
import { isAdminLoginRole } from "../../../services/auth/loginRole";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { API_MANAGEMENT_TABLE_COLUMNS } from "../constants/apiManagement";
import {
  createApiKey,
  deleteApiKey,
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
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [formMode, setFormMode] = useState(null); // "add" | "edit" | null
  const [activeRecord, setActiveRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    setListError("");
    try {
      const result = await fetchApiKeysList({ page: 1, limit: 100 });
      setRecords(result.items);
    } catch (error) {
      setRecords([]);
      setListError(
        error?.message || "Unable to load API configurations."
      );
      toastApiError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!allowed) return;
    loadRecords();
  }, [allowed, loadRecords]);

  if (!allowed) {
    return <PermissionDenied isDarkMode={isDarkMode} />;
  }

  const openAdd = () => {
    setActiveRecord(null);
    setFormMode("add");
  };

  const openEdit = (record) => {
    setActiveRecord(record);
    setFormMode("edit");
  };

  const closeForm = () => {
    if (isSaving) return;
    setFormMode(null);
    setActiveRecord(null);
  };

  const handleFormSubmit = async (formValues, { mode }) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (mode === "edit" && activeRecord?.id != null) {
        const data = await updateApiKey(activeRecord.id, formValues);
        toastApiSuccess(data, "API configuration updated successfully.");
      } else {
        const data = await createApiKey(formValues);
        toastApiSuccess(data, "API configuration created successfully.");
      }
      setFormMode(null);
      setActiveRecord(null);
      await loadRecords();
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

  const addButton = (
    <button
      type="button"
      onClick={openAdd}
      disabled={isLoading || isSaving}
      className="admin-btn-primary inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Plus size={16} />
      Add API
    </button>
  );

  const cardTitle = showTitle ? "API Management" : null;

  if (isLoading) {
    return (
      <TableCard title={cardTitle} isDarkMode={isDarkMode}>
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2
            size={28}
            className="animate-spin text-[var(--admin-primary-color)]"
          />
        </div>
      </TableCard>
    );
  }

  if (listError && records.length === 0) {
    return (
      <TableCard title={cardTitle} isDarkMode={isDarkMode} headerAction={addButton}>
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
      </TableCard>
    );
  }

  if (records.length === 0) {
    return (
      <>
        <TableCard title={cardTitle} isDarkMode={isDarkMode} headerAction={addButton}>
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <p className="admin-text text-sm font-semibold">
              No API integrations configured
            </p>
            <p className="admin-text-muted max-w-md text-sm">
              Add an API integration to manage your external API credentials and
              configuration.
            </p>
            {addButton}
          </div>
        </TableCard>

        <ApiManagementFormModal
          isOpen={formMode === "add"}
          mode="add"
          isDarkMode={isDarkMode}
          isSubmitting={isSaving}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
        />
      </>
    );
  }

  return (
    <>
      <TableCard
        title={cardTitle}
        isDarkMode={isDarkMode}
        flush
        headerAction={addButton}
      >
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
                  <td className="admin-table-ellipsis-cell max-w-[160px] px-4 py-3 align-middle">
                    <TableEllipsisText>{row.apiName}</TableEllipsisText>
                  </td>
                  <td className="admin-table-ellipsis-cell max-w-[200px] px-4 py-3 align-middle">
                    <TableEllipsisText>{row.apiLabel}</TableEllipsisText>
                  </td>
                  <td className="admin-table-ellipsis-cell max-w-[140px] px-4 py-3 align-middle">
                    <TableEllipsisText>{row.apiUserId}</TableEllipsisText>
                  </td>
                  <td className="admin-table-ellipsis-cell max-w-[200px] px-4 py-3 align-middle">
                    <TableEllipsisText>{row.baseUrl}</TableEllipsisText>
                  </td>
                  <td className="admin-table-ellipsis-cell max-w-[140px] px-4 py-3 align-middle">
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
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setViewRecord(row)}
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
      </TableCard>

      <ApiManagementFormModal
        isOpen={formMode === "add" || formMode === "edit"}
        mode={formMode === "edit" ? "edit" : "add"}
        record={activeRecord}
        isDarkMode={isDarkMode}
        isSubmitting={isSaving}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
      />

      <ApiManagementViewModal
        isOpen={Boolean(viewRecord)}
        record={viewRecord}
        onClose={() => setViewRecord(null)}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete API"
        message={`Are you sure you want to remove "${deleteTarget?.apiName ?? "this API"}"? This cannot be undone.`}
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
