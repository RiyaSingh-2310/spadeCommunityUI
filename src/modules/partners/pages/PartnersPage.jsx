import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useListingPageActions } from "../../shared/hooks/useListingPageActions";

const NAMES = [
  "John Smith",
  "Emma Wilson",
  "Deepak Traders",
  "Traver Recycling",
  "Green Loop Solutions",
  "Pacific Metals Co.",
];

const initialRows = Array.from({ length: 12 }, (_, idx) => ({
  id: `ptn-${idx + 1}`,
  partnerCode: `PTN-${1001 + idx}`,
  name: NAMES[idx % NAMES.length],
  image: idx % 2 === 0 ? `https://i.pravatar.cc/80?img=${12 + idx}` : undefined,
  emailAddress: `partner${idx + 1}@example.com`,
  country: ["United States", "United Kingdom", "India", "UAE", "Canada", "Australia"][idx % 6],
  contactNumber: `+1 987654${String(3210 + idx).slice(-4)}`,
  websiteUrl: `www.partner${idx + 1}.com`,
  status: idx % 4 === 0 ? "Inactive" : "Active",
}));

function PartnersPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { rows, onEdit, onDelete, onStatusToggle } = useListingPageActions({
    initialRows,
    editPath: "/partners",
  });

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Partners"
      searchPlaceholder="Search partners..."
      actionLabel="Add Partner"
      onActionClick={() => navigate("/partners/add")}
      columns={[
        "S.No",
        "Partner Code",
        "Name",
        "Email Address",
        "Country",
        "Contact Number",
        "Website URL",
        "Status",
        "Action",
      ]}
      rows={rows}
      rowIdKey="id"
      onEdit={onEdit}
      onDelete={onDelete}
      onStatusToggle={onStatusToggle}
      permissionModule="partners"
      nowrapAllCells
    />
  );
}

export default PartnersPage;
