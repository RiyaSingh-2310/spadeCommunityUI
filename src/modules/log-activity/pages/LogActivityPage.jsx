import { useState } from "react";
import { Trash2 } from "lucide-react";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import TableCard from "../../../components/admin/TableCard";

const initialRows = [
  { name: "John Doe", logDate: "02/06/2026 10:45 AM" },
  { name: "Ava Brown", logDate: "02/06/2026 11:15 AM" },
  { name: "Liam Jones", logDate: "02/06/2026 12:05 PM" },
];

function LogActivityPage({ isDarkMode }) {
  const [rows, setRows] = useState(initialRows);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Log Activity"
        subtitle="Track user actions and activity logs."
        isDarkMode={isDarkMode}
      />
      <TableCard isDarkMode={isDarkMode}>
        <table className="min-w-full text-sm">
          <thead>
            <tr className={isDarkMode ? "text-[#9fb0c8]" : "text-[#6f8098]"}>
              {["Name", "Log Date", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.name}-${index}`} className={`border-t ${isDarkMode ? "border-[#263850]" : "border-[#e6edf5]"}`}>
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3">{row.logDate}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== index))}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                      isDarkMode
                        ? "text-[#f18484] hover:bg-[#301f2d]"
                        : "text-[#de3d3d] hover:bg-[#fff1f1]"
                    }`}
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

export default LogActivityPage;
