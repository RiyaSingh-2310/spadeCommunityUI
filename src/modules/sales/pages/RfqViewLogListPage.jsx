import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import TableCard from "../../../components/admin/TableCard";
import { toastApiError } from "../../../services/toast/apiToast";
import {
  getRecord,
  getSalesLogListWithDetails,
  mapSalesProjectToForm,
} from "../../../services/sales/salesProjectsApi";
import { sanitizeHtml } from "../../shared/utils/sanitizeHtml";

function RichTextContent({ html }) {
  const content = String(html ?? "").trim();
  if (!content) {
    return <p className="admin-text-muted text-sm">—</p>;
  }

  return (
    <div
      className="admin-html-content admin-text max-w-none text-sm leading-relaxed [&_a]:text-[#10a950] [&_a]:underline [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-2 [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--admin-border)] [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-[var(--admin-border)] [&_th]:bg-[var(--admin-permissions-table-head-bg)] [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  );
}

function LogCard({ log, isDarkMode }) {
  return (
    <TableCard isDarkMode={isDarkMode}>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 border-b border-[var(--admin-header-surface-border)] pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <h2
            className="admin-text min-w-0 flex-1 text-base font-semibold truncate"
            title={log.emailSubject || undefined}
          >
            {log.emailSubject || "—"}
          </h2>
          <div className="admin-text shrink-0 text-right text-sm flex gap-2">
            <p>{log.createdDateLabel}</p>
            {log.createdTimeLabel ? <p>{log.createdTimeLabel}</p> : null}
          </div>
        </div>

        <div>
          <p className="admin-text-subtle text-xs font-semibold tracking-[0.02em]">
            Comment By:
          </p>
          <p className="admin-text mt-1 text-sm">{log.commentBy || "—"}</p>
        </div>

        <div>
          <p className="admin-text-subtle text-xs font-semibold tracking-[0.02em]">
            Description:
          </p>
          <div className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <RichTextContent html={log.commentHtml} />
          </div>
        </div>
      </div>
    </TableCard>
  );
}

function RfqViewLogListPage({ isDarkMode }) {
  const { projectId } = useParams();
  const [logs, setLogs] = useState([]);
  const [projectSubject, setProjectSubject] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const normalizedId = String(projectId ?? "").trim();
    if (!normalizedId) {
      setLoadFailed(true);
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadFailed(false);

      try {
        const [project, logData] = await Promise.all([
          getRecord(normalizedId),
          getSalesLogListWithDetails(normalizedId),
        ]);
        if (cancelled) return;

        const mapped = mapSalesProjectToForm(project);
        setProjectSubject(String(mapped.subject ?? "").trim());
        setProjectName(String(mapped.clientName ?? "").trim());
        setLogs(logData.items ?? []);
      } catch (error) {
        if (cancelled) return;
        setLogs([]);
        setProjectSubject("");
        setProjectName("");
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
  }, [projectId]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Sales Project Logs"
        subtitle={
          projectName
            ? `${projectName}${projectSubject ? ` · ${projectSubject}` : ""}`
            : projectSubject || "View communication logs for this sales project."
        }
        isDarkMode={isDarkMode}
        breadcrumbs={[
          { label: "Sales Projects", to: "/sales/rfq" },
          { label: "View Logs" },
        ]}
      />

      {!isLoading && !loadFailed ? (
        <TableCard title="Current Email Subject" isDarkMode={isDarkMode}>
          <p className="admin-text text-sm font-semibold">
            {projectSubject || "—"}
          </p>
          <p className="admin-text-muted mt-1 text-xs">
            Latest value from the sales project record (same source as Edit).
          </p>
        </TableCard>
      ) : null}

      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[var(--admin-primary-color)]" />
        </div>
      ) : loadFailed ? (
        <div className="admin-text rounded-xl border border-[var(--admin-header-surface-border)] p-6 text-sm">
          Unable to load sales project logs.
        </div>
      ) : logs.length === 0 ? (
        <div className="admin-text-muted rounded-xl border border-[var(--admin-header-surface-border)] p-6 text-center text-sm">
          No logs found for this project.
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <LogCard key={log.id} log={log} isDarkMode={isDarkMode} />
          ))}
        </div>
      )}
    </div>
  );
}

export default RfqViewLogListPage;
