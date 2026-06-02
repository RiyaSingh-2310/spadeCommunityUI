import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = [
  {
    image: "https://i.pravatar.cc/80?img=11",
    name: "Arun Kumar",
    emailAddress: "arun@spadecommunity.com",
    status: "Active",
    avatar: "https://i.pravatar.cc/80?img=11",
  },
  {
    image: "https://i.pravatar.cc/80?img=21",
    name: "Meera Singh",
    emailAddress: "meera@spadecommunity.com",
    status: "Inactive",
    avatar: "https://i.pravatar.cc/80?img=21",
  },
];

function SalesManagerPage({ isDarkMode }) {
  const navigate = useNavigate();
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Sales Manager"
      searchPlaceholder="Search sales managers..."
      actionLabel="Add Sales Manager"
      onActionClick={() => navigate("/sales/sales-manager/add")}
      columns={["Name", "Email Address", "Status", "Action"]}
      rows={rows}
    />
  );
}

export default SalesManagerPage;
