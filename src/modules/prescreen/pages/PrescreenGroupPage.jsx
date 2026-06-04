import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useListingPageActions } from "../../shared/hooks/useListingPageActions";

const TITLES = [
  "Checking Bots",
  "Arabic Survey",
  "German Survey",
  "Security Checks",
  "Questions For Bots",
  "Fraud Detection Pack",
];

const initialRows = Array.from({ length: 12 }, (_, idx) => ({
  id: `pg-${idx + 1}`,
  surveyTitle: TITLES[idx % TITLES.length],
  language: ["English", "Arabic", "German", "French", "Spanish"][idx % 5],
  status: idx % 4 === 0 ? "Inactive" : "Active",
}));

function PrescreenGroupPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { rows, onEdit, onDelete, onStatusToggle } = useListingPageActions({
    initialRows,
    editPath: "/prescreen/group",
  });

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Prescreen Group"
      searchPlaceholder="Search prescreen groups..."
      actionLabel="Add Prescreen Group"
      onActionClick={() => navigate("/prescreen/group/add")}
      columns={["S.No", "Survey Title", "Language", "Status", "Action"]}
      rows={rows}
      rowIdKey="id"
      onEdit={onEdit}
      onDelete={onDelete}
      onStatusToggle={onStatusToggle}
      permissionModule="prescreen_group"
      nowrapAllCells
    />
  );
}

export default PrescreenGroupPage;
