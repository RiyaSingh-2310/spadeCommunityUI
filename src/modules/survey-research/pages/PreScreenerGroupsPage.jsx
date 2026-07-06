import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import PortalDataTable from "../components/PortalDataTable";
import PortalDrawer from "../components/PortalDrawer";
import PortalStatusBadge from "../components/PortalStatusBadge";
import { PRESCREENER_GROUPS } from "../data/mockSurveyResearchData";
import { usePortalTable } from "../hooks/usePortalTable";

const TABLE_COLUMNS = [
  { key: "groupName", label: "Group Name", sortable: true },
  { key: "language", label: "Language", sortable: true },
  { key: "totalQuestions", label: "Total Questions", sortable: true },
  { key: "createdDate", label: "Created Date", sortable: true },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (row) => <PortalStatusBadge status={row.status} />,
  },
];

function PreScreenerGroupsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(PRESCREENER_GROUPS);
  const [viewTarget, setViewTarget] = useState(null);
  const [isLoading] = useState(false);

  const table = usePortalTable({
    rows,
    searchKeys: ["groupName", "language", "status", "questionnaireTitle"],
    initialPageSize: 10,
    initialSort: { key: "createdDate", direction: "desc" },
  });

  const columns = useMemo(() => TABLE_COLUMNS, []);

  const handleDelete = (row) => {
    if (!window.confirm(`Delete "${row.groupName}"?`)) return;
    setRows((prev) => prev.filter((item) => item.id !== row.id));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pre-Screener Group Management</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--srp-text-muted)" }}>
            Configure eligibility questionnaires with search, filters, sorting, and pagination.
          </p>
        </div>
        <Link to="/survey-research/pre-screener-groups/add" className="srp-btn-primary">
          <Plus size={16} />
          Add Group
        </Link>
      </div>

      <div className="srp-card p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <input
            type="search"
            value={table.query}
            onChange={(event) => table.setQuery(event.target.value)}
            placeholder="Search groups..."
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--srp-border)", background: "var(--srp-surface)" }}
          />
          <select
            value={table.statusFilter}
            onChange={(event) => table.setStatusFilter(event.target.value)}
            className="rounded-xl border px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--srp-border)", background: "var(--srp-surface)" }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
          <select
            value={table.languageFilter}
            onChange={(event) => table.setLanguageFilter(event.target.value)}
            className="rounded-xl border px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--srp-border)", background: "var(--srp-surface)" }}
          >
            <option value="all">All Languages</option>
            {table.languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>
      </div>

      <PortalDataTable
        columns={columns}
        rows={table.pageRows}
        sort={table.sort}
        onSort={table.toggleSort}
        isLoading={isLoading}
        emptyMessage="No pre-screener groups match your filters."
        page={table.page}
        totalPages={table.totalPages}
        total={table.total}
        pageSize={table.pageSize}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        renderActions={(row) => (
          <div className="inline-flex items-center justify-end gap-1">
            <button
              type="button"
              className="srp-btn-ghost"
              onClick={() => setViewTarget(row)}
              aria-label="View group"
            >
              <Eye size={15} />
              <span className="hidden sm:inline">View</span>
            </button>
            <button
              type="button"
              className="srp-btn-ghost"
              onClick={() => navigate(`/survey-research/pre-screener-groups/edit/${row.id}`)}
              aria-label="Edit group"
            >
              <Pencil size={15} />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              type="button"
              className="srp-btn-ghost"
              onClick={() => handleDelete(row)}
              aria-label="Delete group"
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        )}
      />

      <PortalDrawer
        isOpen={Boolean(viewTarget)}
        group={viewTarget}
        onClose={() => setViewTarget(null)}
      />
    </div>
  );
}

export default PreScreenerGroupsPage;
