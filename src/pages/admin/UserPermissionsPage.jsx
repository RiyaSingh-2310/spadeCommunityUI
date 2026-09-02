import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import TableCard from "../../components/admin/TableCard";
import UserPermissionsTable from "../../components/admin/UserPermissionsTable";
import { hasSavedDownloadPermission } from "../../modules/permissions/downloadPermissionsCsv";
import {
  createDefaultPermissions,
  normalizePermissions,
  permissionsEqual,
  resolvePermissionsFromRecord,
} from "../../modules/permissions/permissionsUtils";
import { useCsvExport } from "../../modules/shared/hooks/useCsvExport";
import { toastApiError, toastApiSuccess } from "../../services/toast/apiToast";
import { exportProjectManagersCsv } from "../../services/projectManagers/projectManagersApi";
import {
  getRecord,
  updatePermissions,
} from "../../services/users/usersApi";

function UserPermissionsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [userName, setUserName] = useState("");
  const [permissions, setPermissions] = useState(createDefaultPermissions);
  const [savedPermissions, setSavedPermissions] = useState(createDefaultPermissions);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canDownloadCsv = useMemo(
    () => hasSavedDownloadPermission(savedPermissions),
    [savedPermissions]
  );

  const exportCsv = useCallback(() => exportProjectManagersCsv(), []);
  const { isExporting, downloadCsv } = useCsvExport(exportCsv);

  useEffect(() => {
    if (!id) return undefined;

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadFailed(false);
      try {
        const admin = await getRecord(id);
        if (cancelled) return;
        setUserName(admin?.name ?? `User #${id}`);
        const resolved = resolvePermissionsFromRecord(admin);
        setPermissions(resolved);
        setSavedPermissions(resolved);
      } catch (error) {
        if (cancelled) return;
        setLoadFailed(true);
        toastApiError(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await updatePermissions(id, permissions);
      const nextSaved = normalizePermissions(permissions);
      setPermissions(nextSaved);
      setSavedPermissions(nextSaved);
      toastApiSuccess(
        data,
        data?.message || "Permissions updated successfully."
      );
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const isDirty = !permissionsEqual(permissions, savedPermissions);
    if (isDirty) {
      setPermissions(normalizePermissions(savedPermissions));
      return;
    }
    navigate("/users");
  };

  const handleDownloadCsv = () => {
    if (!canDownloadCsv || isExporting || isSubmitting) return;
    downloadCsv();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24">
        <Loader2 size={24} className="animate-spin text-[var(--admin-success-text)]" />
        <span className="admin-text-muted text-sm">Loading permissions...</span>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Manage Permissions"
          breadcrumbs={[
            { label: "Users", to: "/users" },
            { label: "Manage Permissions" },
          ]}
          isDarkMode={isDarkMode}
        />
        <button
          type="button"
          onClick={() => navigate("/users")}
          className="admin-text h-11 rounded-xl border border-[var(--admin-header-surface-border)] px-5 text-sm font-semibold"
        >
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Manage Permissions"
        subtitle={userName}
        breadcrumbs={[
          { label: "Users", to: "/users" },
          { label: "Manage Permissions" },
        ]}
        isDarkMode={isDarkMode}
      />

      <form onSubmit={onSubmit} className="space-y-5">
        <TableCard title="User Permissions" isDarkMode={isDarkMode}>
          <UserPermissionsTable
            permissions={permissions}
            onChange={setPermissions}
            disabled={isSubmitting}
          />
        </TableCard>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? "Updating..." : "Update"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting || isExporting}
            className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={!canDownloadCsv || isExporting || isSubmitting}
            className="admin-btn-cancel inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            title={
              canDownloadCsv
                ? "Download Project Manager CSV"
                : "Save at least one Download (csv_download) permission to enable CSV download"
            }
          >
            {isExporting ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : null}
            {isExporting ? "Downloading..." : "Download CSV"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UserPermissionsPage;
