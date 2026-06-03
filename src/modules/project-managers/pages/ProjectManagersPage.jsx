import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";

const NAMES = ["Aarav Mehta", "Kriti Nair", "Rahul Roy", "Sophia Chen", "Marcus Johnson", "Priya Desai"];

const rows = Array.from({ length: 12 }, (_, idx) => ({
  id: `pm-${idx + 1}`,
  name: NAMES[idx % NAMES.length],
  image: idx % 2 === 0 ? `https://i.pravatar.cc/80?img=${15 + idx}` : undefined,
  emailAddress: `pm${idx + 1}@spadecommunity.com`,
  status: idx % 4 === 0 ? "Inactive" : "Active",
}));

function ProjectManagersPage({ isDarkMode }) {
  const navigate = useNavigate();

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
      nowrapAllCells
    />
  );
}

export default ProjectManagersPage;
