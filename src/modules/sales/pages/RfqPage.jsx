import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";

const NAMES = ["Rohan Kumar", "Sarah Khan", "Marcus Johnson", "Priya Desai", "Emma Wilson", "David Roy"];
const COUNTRIES = ["India", "UAE", "United States", "United Kingdom", "Canada", "Germany"];

const rows = Array.from({ length: 12 }, (_, idx) => ({
  id: `RFQ-${1001 + idx}`,
  name: NAMES[idx % NAMES.length],
  emailAddress: `rfq${idx + 1}@example.com`,
  projectId: idx % 3 === 0 ? "" : `P-${900 + idx}`,
  country: COUNTRIES[idx % COUNTRIES.length],
}));

function RfqPage({ isDarkMode }) {
  const navigate = useNavigate();

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="RFQ"
      searchPlaceholder="Search RFQ..."
      actionLabel="Add RFQ"
      onActionClick={() => navigate("/sales/rfq/add")}
      columns={["S.No", "ID", "Name", "Email Address", "Project ID (if won)", "Country"]}
      rows={rows}
      showStatus={false}
      nowrapAllCells
    />
  );
}

export default RfqPage;
