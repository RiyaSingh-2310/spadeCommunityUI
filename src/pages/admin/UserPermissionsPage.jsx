import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import TableCard from "../../components/admin/TableCard";
import UserPermissionActionBar from "../../components/admin/UserPermissionActionBar";
import UserPermissionsTable from "../../components/admin/UserPermissionsTable";
import {
  createDefaultPermissions,
  resolvePermissionsFromRecord,
} from "../../modules/permissions/permissionsUtils";
import {
  createEmptyDownloadSelections,
  exportSelectedModulesCsv,
  getSelectedDownloadModuleKeys,
  hasAnyDownloadSelection,
  permissionsForPersist,
} from "../../modules/permissions/temporaryDownloadSelections";
import { toastApiError, toastApiSuccess } from "../../services/toast/apiToast";
import {
  getRecord,
  updatePermissions,
} from "../../services/users/usersApi";

function UserPermissionsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [userName, setUserName] = useState("");
  const [permissions, setPermissions] = useState(createDefaultPermissions);
  const [downloadSelections, setDownloadSelections] = useState(
    createEmptyDownloadSelections
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);

  const canDownloadCsv = useMemo(
    () => hasAnyDownloadSelection(downloadSelections),
    [downloadSelections]
  );

  useEffect(() => {
    if (!id) return undefined;

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadFailed(false);
      setDownloadSelections(createEmptyDownloadSelections());
      try {
        const admin = await getRecord(id);
        if (cancelled) return;
        setUserName(admin?.name ?? `User #${id}`);
        // Load Read/Write only — Download checkboxes always start unchecked.
        setPermissions(permissionsForPersist(resolvePermissionsFromRecord(admin)));
        setDownloadSelections(createEmptyDownloadSelections());
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
      const data = await updatePermissions(id, permissionsForPersist(permissions));
      navigate("/users", {
        replace: true,
        state: {
          flash: {
            type: "success",
            message: data?.message || "Admin updated successfully.",
          },
          refresh: true,
        },
      });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDownloadSelections(createEmptyDownloadSelections());
    navigate("/users");
  };

  const handleDownloadCsv = async () => {
    if (!canDownloadCsv || isDownloadingCsv || isSubmitting) return;

    const selectedKeys = getSelectedDownloadModuleKeys(downloadSelections);
    setIsDownloadingCsv(true);
    try {
      const result = await exportSelectedModulesCsv(selectedKeys);
      toastApiSuccess(result);
      setDownloadSelections(createEmptyDownloadSelections());
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDownloadingCsv(false);
    }
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
            disabled={isSubmitting || isDownloadingCsv}
            showDownload
            downloadSelections={downloadSelections}
            onDownloadSelectionsChange={setDownloadSelections}
          />
        </TableCard>

        <UserPermissionActionBar
          showDownloadCsv
          canDownloadCsv={canDownloadCsv}
          isDownloadingCsv={isDownloadingCsv}
          isSubmitting={isSubmitting}
          canSubmit={!isSubmitting}
          submitLabel="Update"
          submittingLabel="Updating..."
          onCancel={handleCancel}
          onDownloadCsv={handleDownloadCsv}
        />
      </form>
    </div>
  );
}

export default UserPermissionsPage;
