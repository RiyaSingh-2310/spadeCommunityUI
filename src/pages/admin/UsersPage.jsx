import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import IconActions from "../../components/admin/IconActions";
import StatusToggle from "../../components/admin/StatusToggle";
import TableCard from "../../components/admin/TableCard";

const initialUsers = [
  { id: 1, name: "John Doe", email: "john@example.com", enabled: true },
  { id: 2, name: "Ava Brown", email: "ava@example.com", enabled: true },
  { id: 3, name: "Liam Jones", email: "liam@example.com", enabled: false },
  { id: 4, name: "Sophia Miles", email: "sophia@example.com", enabled: true },
];

function UsersPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(initialUsers);

  const filtered = useMemo(
    () =>
      rows.filter((user) =>
        `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())
      ),
    [rows, query]
  );

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Admin Users" isDarkMode={isDarkMode} />

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <label className={`flex h-10 w-full items-center gap-2 rounded-xl border px-3 sm:max-w-[320px] ${
          isDarkMode ? "border-[#344662] bg-[#101a2a]" : "border-[#d8e3ef] bg-white"
        }`}>
          <Search size={15} className="admin-text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="admin-text w-full bg-transparent text-sm outline-none placeholder:text-[var(--admin-subtle-foreground)]"
            placeholder="Search users..."
          />
        </label>
        <button
          onClick={() => navigate("/users/add")}
          className="h-10 rounded-xl bg-[#10a950] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(16,169,80,0.28)] transition hover:bg-[#0f9b49]"
        >
          Add User
        </button>
      </div>

      <TableCard isDarkMode={isDarkMode}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
          <thead>
            <tr className="admin-text-muted">
              {["ID", "Name", "Email", "Status", "Action"].map((h) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${
                    h === "Action" ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className={`border-t align-middle ${isDarkMode ? "border-[#263850]" : "border-[#e6edf5]"}`}>
                <td className="admin-text px-4 py-3 align-middle">{user.id}</td>
                <td className="px-4 py-3 align-middle">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#18a354]/20 text-xs font-semibold text-[var(--admin-success-text)]">
                      {user.name.slice(0, 1)}
                    </span>
                    <span className="admin-text">{user.name}</span>
                  </div>
                </td>
                <td className="admin-text px-4 py-3 align-middle whitespace-nowrap">{user.email}</td>
                <td className="px-4 py-3 align-middle">
                  <StatusToggle
                    checked={user.enabled}
                    onChange={() =>
                      setRows((prev) =>
                        prev.map((item) =>
                          item.id === user.id ? { ...item, enabled: !item.enabled } : item
                        )
                      )
                    }
                  />
                </td>
                <td className="px-4 py-3 align-middle text-right">
                  <IconActions
                    isDarkMode={isDarkMode}
                    onEdit={() => navigate(`/users/edit/${user.id}`)}
                    onDelete={() => setRows((prev) => prev.filter((item) => item.id !== user.id))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </TableCard>
    </div>
  );
}

export default UsersPage;
