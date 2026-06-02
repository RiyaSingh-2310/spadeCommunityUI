import { Search } from "lucide-react";
import { useState } from "react";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import IconActions from "../../../components/admin/IconActions";
import StatusToggle from "../../../components/admin/StatusToggle";
import TableCard from "../../../components/admin/TableCard";

function ModuleListingPage({
  isDarkMode,
  title,
  subtitle,
  breadcrumbs,
  searchPlaceholder = "Search records...",
  actionLabel = "Add",
  onActionClick,
  columns = [],
  rows = [],
  showStatus = true,
}) {
  const [query, setQuery] = useState("");
  const [data, setData] = useState(rows);

  const filtered = data.filter((row) =>
    Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        isDarkMode={isDarkMode}
      />
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <label
          className={`flex h-10 w-full items-center gap-2 rounded-xl border px-3 sm:max-w-[340px] ${
            isDarkMode ? "border-[#344662] bg-[#101a2a]" : "border-[#d8e3ef] bg-white"
          }`}
        >
          <Search size={15} className="admin-text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="admin-text w-full bg-transparent text-sm outline-none placeholder:text-[var(--admin-subtle-foreground)]"
            placeholder={searchPlaceholder}
          />
        </label>
        <button
          onClick={onActionClick}
          className="h-10 rounded-xl bg-[#10a950] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(16,169,80,0.28)] transition hover:bg-[#0f9b49]"
        >
          {actionLabel}
        </button>
      </div>

      <TableCard isDarkMode={isDarkMode}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
          <thead>
            <tr className="admin-text-muted">
              {columns.map((h) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${
                    h === "Action" || h === "Actions" ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => (
              <tr key={`${row.name || row.id}-${idx}`} className={`border-t align-middle ${isDarkMode ? "border-[#263850]" : "border-[#e6edf5]"}`}>
                {columns.map((col) => {
                  const key = col.toLowerCase().replace(/\s/g, "");
                  if (key === "status" && showStatus) {
                    return (
                      <td key={col} className="px-4 py-3 align-middle">
                        <StatusToggle
                          checked={String(row.status || "").toLowerCase() === "active"}
                          onChange={() =>
                            setData((prev) =>
                              prev.map((item, itemIdx) =>
                                itemIdx === idx
                                  ? {
                                      ...item,
                                      status:
                                        String(item.status).toLowerCase() === "active"
                                          ? "Inactive"
                                          : "Active",
                                    }
                                  : item
                              )
                            )
                          }
                        />
                      </td>
                    );
                  }
                  if (key === "action" || key === "actions") {
                    return (
                      <td key={col} className="px-4 py-3 align-middle text-right">
                        <IconActions isDarkMode={isDarkMode} />
                      </td>
                    );
                  }
                  const value = row[key] ?? row[col] ?? "-";
                  if (key === "name" && row.avatar) {
                    return (
                      <td key={col} className="px-4 py-3 align-middle whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <img src={row.image} alt={row.name} className="h-8 w-8 rounded-full object-cover" />
                          <span className="admin-text">{row.name}</span>
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td
                      key={col}
                      className={`px-4 py-3 align-middle ${
                        [
                          "id",
                          "sno",
                          "partnercode",
                          "emailaddress",
                          "projectid",
                          "country",
                          "contactnumber",
                          "websiteurl",
                          "status",
                        ].includes(key)
                          ? "whitespace-nowrap"
                          : ""
                      }`}
                    >
                      <span className="admin-text">{value}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </TableCard>
    </div>
  );
}

export default ModuleListingPage;
