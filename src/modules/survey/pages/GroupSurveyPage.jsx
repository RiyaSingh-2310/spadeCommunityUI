import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useListingPageActions } from "../../shared/hooks/useListingPageActions";

const CLIENTS = ["Alpha Corp", "Beta Labs", "Gamma Tech", "Delta Works", "Epsilon Ltd"];
const PROJECTS = [
  "Group Wave 1",
  "Group Wave 2",
  "Panel Sync Study",
  "Community Panel Q3",
  "Segmentation Wave",
];

const initialRows = Array.from({ length: 12 }, (_, idx) => ({
  id: `GSV-${41 + idx}`,
  clientName: CLIENTS[idx % CLIENTS.length],
  projectName: PROJECTS[idx % PROJECTS.length],
  status: idx % 5 === 0 ? "Inactive" : "Active",
}));

function GroupSurveyPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { rows, onStatusToggle } = useListingPageActions({
    initialRows,
    editPath: "/survey/group",
  });

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Group Survey"
      subtitle="Manage group survey records here."
      searchPlaceholder="Search group surveys..."
      actionLabel="Add Group Survey"
      columns={["S. No.", "Client Name", "Project Name", "Status", "Action"]}
      rows={rows}
      rowIdKey="id"
      actionVariant="view-edit"
      showDeleteAction={false}
      editPath="/survey/group"
      onView={(row) => {
        const id = row.id;
        if (id == null) return;
        navigate(`/survey/group/view/${encodeURIComponent(id)}`);
      }}
      onStatusToggle={onStatusToggle}
      permissionModule="group_survey"
      searchFields={["clientName", "projectName"]}
      nowrapAllCells
    />
  );
}

export default GroupSurveyPage;
