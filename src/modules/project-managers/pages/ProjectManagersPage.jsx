import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useListingPageActions } from "../../shared/hooks/useListingPageActions";

const NAMES = ["Aarav Mehta", "Kriti Nair", "Rahul Roy", "Sophia Chen", "Marcus Johnson", "Priya Desai"];

const initialRows = Array.from({ length: 12 }, (_, idx) => ({
  id: `pm-${idx + 1}`,
  name: NAMES[idx % NAMES.length],
  image: idx % 2 === 0 ? `https://i.pravatar.cc/80?img=${15 + idx}` : undefined,
  emailAddress: `pm${idx + 1}@spadecommunity.com`,
  status: idx % 4 === 0 ? "Inactive" : "Active",
}));

function ProjectManagersPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { rows, onEdit, onDelete, onStatusToggle } = useListingPageActions({
    initialRows,
    editPath: "/project-managers",
  });

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Project Managers"
      searchPlaceholder="Search project managers..."
      actionLabel="Add Project Manager"
      onActionClick={() => navigate("/project-managers/add")}
      columns={["S.No", "Name", "Email Address", "Status", "Action"]}
      rows={rows}
      rowIdKey="id"
      onEdit={onEdit}
      onDelete={onDelete}
      onStatusToggle={onStatusToggle}
      permissionModule="project_managers"
      nowrapAllCells
    />
  );
}

export default ProjectManagersPage;
