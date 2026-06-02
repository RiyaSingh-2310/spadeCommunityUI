import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import IconActions from "../../components/admin/IconActions";
import StatusToggle from "../../components/admin/StatusToggle";
import TableCard from "../../components/admin/TableCard";

const initialClients = [
  { id: 1, code: "CL-1001", name: "Alpha Corp", email: "ops@alpha.com", country: "India", contact: "+91 9876543210", website: "www.alpha.com", active: true },
  { id: 2, code: "CL-1002", name: "Beta Labs", email: "admin@beta.com", country: "UAE", contact: "+971 555551111", website: "www.beta.com", active: true },
  { id: 3, code: "CL-1003", name: "Gamma Tech", email: "team@gamma.com", country: "USA", contact: "+1 2102229988", website: "www.gamma.io", active: false },
];

function ClientsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(initialClients);

  const filtered = useMemo(
    () =>
      rows.filter((client) =>
        `${client.name} ${client.code} ${client.email}`.toLowerCase().includes(query.toLowerCase())
      ),
    [rows, query]
  );

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Client List" isDarkMode={isDarkMode} />

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <label className={`flex h-10 w-full items-center gap-2 rounded-xl border px-3 sm:max-w-[340px] ${
          isDarkMode ? "border-[#344662] bg-[#101a2a]" : "border-[#d8e3ef] bg-white"
        }`}>
          <Search size={15} className={isDarkMode ? "text-[#8ea5c2]" : "text-[#8b98ab]"} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-full bg-transparent text-sm outline-none ${isDarkMode ? "text-[#f8fafc]" : "text-[#1f2b3d]"}`}
            placeholder="Search clients..."
          />
        </label>
        <button
          onClick={() => navigate("/clients/add")}
          className="h-10 rounded-xl bg-[#10a950] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(16,169,80,0.28)] transition hover:bg-[#0f9b49]"
        >
          Add Client User
        </button>
      </div>

      <TableCard isDarkMode={isDarkMode}>
        <table className="min-w-full text-sm">
          <thead>
            <tr className={isDarkMode ? "text-[#9fb0c8]" : "text-[#6f8098]"}>
              {["S.No", "Client Code", "Name", "Email Address", "Country", "Contact Number", "Website URL", "Status", "Action"].map((h) => (
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
            {filtered.map((client) => (
              <tr key={client.id} className={`border-t align-middle ${isDarkMode ? "border-[#263850]" : "border-[#e6edf5]"}`}>
                <td className="px-4 py-3 align-middle">{client.id}</td>
                <td className="px-4 py-3 align-middle whitespace-nowrap">{client.code}</td>
                <td className="px-4 py-3 align-middle">{client.name}</td>
                <td className="px-4 py-3 align-middle whitespace-nowrap">{client.email}</td>
                <td className="px-4 py-3 align-middle whitespace-nowrap">{client.country}</td>
                <td className="px-4 py-3 align-middle whitespace-nowrap">{client.contact}</td>
                <td className="px-4 py-3 align-middle whitespace-nowrap">{client.website}</td>
                <td className="px-4 py-3 align-middle">
                  <StatusToggle
                    checked={client.active}
                    onChange={() =>
                      setRows((prev) =>
                        prev.map((item) =>
                          item.id === client.id ? { ...item, active: !item.active } : item
                        )
                      )
                    }
                  />
                </td>
                <td className="px-4 py-3 align-middle text-right">
                  <IconActions
                    isDarkMode={isDarkMode}
                    onEdit={() => navigate(`/clients/edit/${client.id}`)}
                    onDelete={() => setRows((prev) => prev.filter((item) => item.id !== client.id))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

export default ClientsPage;
