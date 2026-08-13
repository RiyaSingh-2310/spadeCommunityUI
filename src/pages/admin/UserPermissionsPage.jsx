import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import TableCard from "../../components/admin/TableCard";
import UserPermissionsTable from "../../components/admin/UserPermissionsTable";
import {
  createDefaultPermissions,
  resolvePermissionsFromRecord,
} from "../../modules/permissions/permissionsUtils";
import { toastApiError } from "../../services/toast/apiToast";
import {
  getRecord,
  updatePermissions,
} from "../../services/users/usersApi";

function UserPermissionsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [userName, setUserName] = useState("");
  const [permissions, setPermissions] = useState(createDefaultPermissions);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setPermissions(resolvePermissionsFromRecord(admin));
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
      navigate("/users", {
        replace: true,
        state: {
          flash: {
            type: "success",
            message: data?.message || "Permissions updated successfully.",
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
            {isSubmitting ? "Updating..." : "Update Permissions"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/users")}
            disabled={isSubmitting}
            className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default UserPermissionsPage;
