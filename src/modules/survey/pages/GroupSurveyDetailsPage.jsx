import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import TableCard from "../../../components/admin/TableCard";
import { formatStatusLabel } from "../../shared/utils/statusLabels";
import { toastApiError } from "../../../services/toast/apiToast";
import { getRecord } from "../services/groupSurveyApi";

function GroupSurveyDetailsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!id) return undefined;

    let cancelled = false;

    const loadRecord = async () => {
      setIsLoading(true);
      setLoadFailed(false);

      try {
        const project = await getRecord(id);
        if (!cancelled) setRecord(project);
      } catch (error) {
        if (!cancelled) {
          toastApiError(error);
          setLoadFailed(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadRecord();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const clientNames = useMemo(() => {
    if (!Array.isArray(record?.clients) || record.clients.length === 0) {
      return "—";
    }
    return record.clients
      .map((client) => client?.name)
      .filter(Boolean)
      .join(", ");
  }, [record]);

  const fields = useMemo(() => {
    if (!record) return [];

    return [
      ["Project Name", record.project_name ?? "—"],
      ["Clients", clientNames],
      ["Status", formatStatusLabel(record.status)],
      ["Description", record.description || "—"],
      ["Notes", record.notes || "—"],
    ];
  }, [record, clientNames]);

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#10a950]" />
      </div>
    );
  }

  if (loadFailed || !record) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Group Survey Details"
          breadcrumbs={[
            { label: "Group Survey", to: "/survey/group" },
            { label: "Details" },
          ]}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text rounded-xl border border-[var(--admin-border)] p-6 text-sm">
          Unable to load group survey details.
          <button
            type="button"
            onClick={() => navigate("/survey/group")}
            className="ml-2 font-semibold text-[#10a950] hover:underline"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Group Survey Details"
        subtitle={record.project_name}
        breadcrumbs={[
          { label: "Group Survey", to: "/survey/group" },
          { label: "Details" },
        ]}
        isDarkMode={isDarkMode}
      />

      <TableCard title="Group Survey Information" isDarkMode={isDarkMode}>
        <dl className="grid gap-4 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className={label === "Description" || label === "Notes" ? "sm:col-span-2" : ""}>
              <dt className="admin-text-muted mb-1 text-xs font-semibold uppercase tracking-wide">
                {label}
              </dt>
              <dd className="admin-text break-words text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate(`/survey/group/edit/${encodeURIComponent(String(id))}`)}
            className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49]"
          >
            Edit Group Survey
          </button>
          <button
            type="button"
            onClick={() => navigate("/survey/group")}
            className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back to List
          </button>
        </div>
      </TableCard>
    </div>
  );
}

export default GroupSurveyDetailsPage;
