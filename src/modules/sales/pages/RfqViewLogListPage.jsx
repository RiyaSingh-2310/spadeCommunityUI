import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import TableCard from "../../../components/admin/TableCard";
import { toastApiError } from "../../../services/toast/apiToast";
import { getSalesLogListWithDetails } from "../../../services/sales/salesProjectsApi";

function RichTextContent({ html }) {
  const content = String(html ?? "").trim();
  if (!content) {
    return <p className="admin-text-muted text-sm">—</p>;
  }

  return (
    <div
      className="admin-html-content admin-text max-w-none text-sm leading-relaxed [&_a]:text-[#10a950] [&_a]:underline [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-2 [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--admin-border)] [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-[var(--admin-border)] [&_th]:bg-[var(--admin-permissions-table-head-bg)] [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: content }}
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
          <p className="admin-text-subtle text-xs font-semibold uppercase tracking-wide">
            Comment By:
          </p>
          <p className="admin-text mt-1 text-sm">{log.commentBy || "—"}</p>
        </div>

        <div>
          <p className="admin-text-subtle text-xs font-semibold uppercase tracking-wide">
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

    const loadLogs = async () => {
      setIsLoading(true);
      setLoadFailed(false);

      try {
        const data = await getSalesLogListWithDetails(normalizedId);
        if (!cancelled) {
          setLogs(data.items ?? []);
        }
      } catch (error) {
        if (cancelled) return;
        setLogs([]);
        setLoadFailed(true);
        toastApiError(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadLogs();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="View Log List"
        breadcrumbs={[
          { label: "RFQ", to: "/sales/rfq" },
          { label: "View Log List" },
        ]}
        isDarkMode={isDarkMode}
      />

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[#10a950]" />
        </div>
      ) : loadFailed ? (
        <TableCard isDarkMode={isDarkMode}>
          <p className="admin-text-muted text-sm">Unable to load logs.</p>
        </TableCard>
      ) : logs.length === 0 ? (
        <TableCard isDarkMode={isDarkMode}>
          <p className="admin-text-muted text-sm">No Data Available</p>
        </TableCard>
      ) : (
        <div className="space-y-5">
          {logs.map((log) => (
            <LogCard key={log.id ?? log.createdAt} log={log} isDarkMode={isDarkMode} />
          ))}
        </div>
      )}
    </div>
  );
}

export default RfqViewLogListPage;
