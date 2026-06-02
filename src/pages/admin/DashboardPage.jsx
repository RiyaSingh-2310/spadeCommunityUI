import { ArrowUpRight, ClipboardList, Handshake, UserCog, Users } from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import TableCard from "../../components/admin/TableCard";

const stats = [
  { icon: Users, label: "Users", count: 128, growth: "+12%" },
  { icon: UserCog, label: "Clients", count: 64, growth: "+8%" },
  { icon: Handshake, label: "Partners", count: 34, growth: "+5%" },
  { icon: ClipboardList, label: "Project Managers", count: 19, growth: "+3%" },
];

const surveyRows = Array.from({ length: 8 }).map((_, idx) => ({
  id: `SRV-${1000 + idx}`,
  name: `Survey ${idx + 1}`,
  start: "2026-06-01",
  end: "2026-06-30",
  status: idx % 2 === 0 ? "Active" : "Inactive",
}));

const liveRows = Array.from({ length: 6 }).map((_, idx) => ({
  id: `LGS-${300 + idx}`,
  name: `Group Survey ${idx + 1}`,
  status: idx % 2 === 0 ? "Active" : "Inactive",
}));

function DashboardPage({ isDarkMode }) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Welcome to Admin Dashboard"
        subtitle="Manage your platform from a centralized dashboard."
        isDarkMode={isDarkMode}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <article
            key={item.label}
            className={`rounded-3xl border p-4 transition-all duration-300 ${
              isDarkMode
                ? "border-[#283b58] bg-[#131f31] shadow-[0_12px_28px_rgba(2,6,23,0.3)]"
                : "border-[#dce7f3] bg-white shadow-[0_8px_20px_rgba(17,36,65,0.08)]"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex rounded-xl bg-[#19a455]/15 p-2 text-[#19a455]">
                <item.icon size={18} />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#19a455]/15 px-2 py-1 text-xs font-semibold text-[#19a455]">
                {item.growth} <ArrowUpRight size={12} />
              </span>
            </div>
            <p className={`text-2xl font-bold ${isDarkMode ? "text-[#f8fafc]" : "text-[#1f2b3d]"}`}>
              {item.count}
            </p>
            <p className={`mt-1 text-sm ${isDarkMode ? "text-[#9fb0c8]" : "text-[#6f8098]"}`}>
              {item.label}
            </p>
          </article>
        ))}
      </div>

      <TableCard title="Survey List" isDarkMode={isDarkMode}>
        <table className="min-w-full text-sm">
          <thead>
            <tr className={isDarkMode ? "text-[#9fb0c8]" : "text-[#6f8098]"}>
              {["ID", "Name", "Start Date", "End Date", "Status", "Action"].map((h) => (
                <th key={h} className="px-3 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {surveyRows.map((row) => (
              <tr key={row.id} className={`border-t ${isDarkMode ? "border-[#263850]" : "border-[#e6edf5]"}`}>
                <td className="px-3 py-3">{row.id}</td>
                <td className="px-3 py-3">{row.name}</td>
                <td className="px-3 py-3">{row.start}</td>
                <td className="px-3 py-3">{row.end}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    row.status === "Active" ? "bg-[#17a34a]/15 text-[#17a34a]" : "bg-[#94a3b8]/20 text-[#7b8da5]"
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <button className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#18a354] hover:bg-[#18a354]/10">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <TableCard title="Live Group Survey" isDarkMode={isDarkMode}>
        <table className="min-w-full text-sm">
          <thead>
            <tr className={isDarkMode ? "text-[#9fb0c8]" : "text-[#6f8098]"}>
              {["ID", "Name", "Status", "Action"].map((h) => (
                <th key={h} className="px-3 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {liveRows.map((row) => (
              <tr key={row.id} className={`border-t ${isDarkMode ? "border-[#263850]" : "border-[#e6edf5]"}`}>
                <td className="px-3 py-3">{row.id}</td>
                <td className="px-3 py-3">{row.name}</td>
                <td className="px-3 py-3">{row.status}</td>
                <td className="px-3 py-3">
                  <button className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#18a354] hover:bg-[#18a354]/10">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

export default DashboardPage;
