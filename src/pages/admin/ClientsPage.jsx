import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../modules/shared/components/ModuleListingPage";

const CLIENT_NAMES = ["Alpha Corp", "Beta Labs", "Gamma Tech", "Delta Works", "Epsilon Ltd"];

const initialClients = Array.from({ length: 12 }, (_, idx) => ({
  id: idx + 1,
  clientCode: `CL-${1001 + idx}`,
  name: CLIENT_NAMES[idx % CLIENT_NAMES.length],
  emailAddress: `contact${idx + 1}@client.com`,
  country: ["India", "UAE", "USA", "UK", "Canada"][idx % 5],
  contactNumber: `+1 555${String(1000 + idx).slice(-4)}`,
  websiteUrl: `https://client${idx + 1}.com`,
  status: idx % 5 === 0 ? "Inactive" : "Active",
  image: idx % 3 === 0 ? `https://i.pravatar.cc/80?img=${20 + idx}` : undefined,
}));

function ClientsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [clients, setClients] = useState(initialClients);
  const [, setListVersion] = useState(0);
  const bumpList = () => setListVersion((v) => v + 1);

  const handleStatusToggle = (row) => {
    setClients((prev) =>
      prev.map((item) =>
        item.id === row.id
          ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" }
          : item
      )
    );
    bumpList();
  };

  const handleDelete = (row) => {
    setClients((prev) => prev.filter((item) => item.id !== row.id));
    bumpList();
  };

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Client List"
      searchPlaceholder="Search clients..."
      actionLabel="Add Client User"
      onActionClick={() => navigate("/clients/add")}
      columns={[
        "S.No",
        "Client Code",
        "Name",
        "Email Address",
        "Country",
        "Contact Number",
        "Website URL",
        "Status",
        "Action",
      ]}
      rows={clients}
      rowIdKey="id"
      onEdit={(row) => navigate(`/clients/edit/${row.id}`)}
      onDelete={handleDelete}
      onStatusToggle={handleStatusToggle}
      nowrapAllCells
    />
  );
}

export default ClientsPage;
