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
  searchPlaceholder = "Search records...",
  actionLabel = "Add",
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
    <div className="space-y-4">
      <AdminPageHeader title={title} subtitle={subtitle} isDarkMode={isDarkMode} />
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <label
          className={`flex h-10 w-full items-center gap-2 rounded-xl border px-3 sm:max-w-[340px] ${
            isDarkMode ? "border-[#344662] bg-[#101a2a]" : "border-[#d8e3ef] bg-white"
          }`}
        >
          <Search size={15} className={isDarkMode ? "text-[#8ea5c2]" : "text-[#8b98ab]"} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-full bg-transparent text-sm outline-none ${isDarkMode ? "text-[#f8fafc]" : "text-[#1f2b3d]"}`}
            placeholder={searchPlaceholder}
          />
        </label>
        <button className="h-10 rounded-xl bg-[#10a950] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(16,169,80,0.28)] transition hover:bg-[#0f9b49]">
          {actionLabel}
        </button>
      </div>

      <TableCard isDarkMode={isDarkMode}>
        <table className="min-w-full text-sm">
          <thead>
            <tr className={isDarkMode ? "text-[#9fb0c8]" : "text-[#6f8098]"}>
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
                  return (
                    <td
                      key={col}
                      className={`px-4 py-3 align-middle ${
                        ["id", "emailaddress", "country", "contactnumber", "websiteurl", "status"].includes(
                          key
                        )
                          ? "whitespace-nowrap"
                          : ""
                      }`}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

export default ModuleListingPage;
