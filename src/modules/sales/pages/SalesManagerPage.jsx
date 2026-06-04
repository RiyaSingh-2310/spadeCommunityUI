import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useListingPageActions } from "../../shared/hooks/useListingPageActions";

const NAMES = ["Arun Kumar", "Meera Singh", "David Roy", "Sarah Khan", "Ahmed Khan", "Emma Wilson"];

const initialRows = Array.from({ length: 12 }, (_, idx) => ({
  id: `sm-${idx + 1}`,
  name: NAMES[idx % NAMES.length],
  emailAddress: `manager${idx + 1}@spadecommunity.com`,
  status: idx % 4 === 0 ? "Inactive" : "Active",
  image: idx % 2 === 0 ? `https://i.pravatar.cc/80?img=${11 + idx}` : undefined,
}));

function SalesManagerPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { rows, onEdit, onDelete, onStatusToggle } = useListingPageActions({
    initialRows,
    editPath: "/sales/sales-manager",
  });

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Sales Manager"
      searchPlaceholder="Search sales managers..."
      actionLabel="Add Sales Manager"
      onActionClick={() => navigate("/sales/sales-manager/add")}
      columns={["S.No", "Name", "Email Address", "Status", "Action"]}
      rows={rows}
      rowIdKey="id"
      onEdit={onEdit}
      onDelete={onDelete}
      onStatusToggle={onStatusToggle}
      permissionModule="sales_manager"
      nowrapAllCells
    />
  );
}

export default SalesManagerPage;
