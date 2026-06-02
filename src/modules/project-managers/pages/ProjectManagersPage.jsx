import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = [
  { name: "Aarav Mehta", emailAddress: "aarav@spadecommunity.com", status: "Active" },
  { name: "Kriti Nair", emailAddress: "kriti@spadecommunity.com", status: "Inactive" },
  { name: "Rahul Roy", emailAddress: "rahul@spadecommunity.com", status: "Active" },
];

function ProjectManagersPage({ isDarkMode }) {
  const navigate = useNavigate();

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Project Managers"
      searchPlaceholder="Search project managers..."
      actionLabel="Add Project Manager"
      onActionClick={() => navigate("/project-managers/add")}
      columns={["Name", "Email Address", "Status", "Action"]}
      rows={rows}
    />
  );
}

export default ProjectManagersPage;
