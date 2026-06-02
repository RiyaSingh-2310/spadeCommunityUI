import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = [
  {
    id: "RFQ-1001",
    name: "Rohan Kumar",
    emailAddress: "rohan@mail.com",
    projectId: "P-901",
    country: "India",
    status: "Active",
  },
  {
    id: "RFQ-1002",
    name: "Sarah Khan",
    emailAddress: "sarah@mail.com",
    projectId: "P-902",
    country: "UAE",
    status: "Inactive",
  },
];

function RfqPage({ isDarkMode }) {
  const navigate = useNavigate();

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="RFQ"
      searchPlaceholder="Search RFQ..."
      actionLabel="Add RFQ"
      onActionClick={() => navigate("/sales/rfq/add")}
      columns={["ID", "Name", "Email Address", "Project ID", "Country", "Status", "Action"]}
      rows={rows}
    />
  );
}

export default RfqPage;
