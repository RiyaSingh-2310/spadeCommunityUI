import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = [
  {
    sno: "1",
    partnerCode: "PRT-1001",
    name: "Deepak Traders",
    emailAddress: "deepak@traders.com",
    country: "India",
    contactNumber: "+91 9876543210",
    websiteUrl: "https://deepaktraders.com",
    status: "Active",
  },
  {
    sno: "2",
    partnerCode: "PRT-1002",
    name: "Traver Recycling",
    emailAddress: "hello@traver.co",
    country: "UAE",
    contactNumber: "+971 567832145",
    websiteUrl: "https://traver.co",
    status: "Inactive",
  },
];

function PartnersPage({ isDarkMode }) {
  const navigate = useNavigate();

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
    />
  );
}

export default PartnersPage;
