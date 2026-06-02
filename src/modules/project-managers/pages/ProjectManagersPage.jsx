import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = [
  { id: "PM-01", name: "Aarav Mehta", status: "Active", action: "" },
  { id: "PM-02", name: "Kriti Nair", status: "Inactive", action: "" },
  { id: "PM-03", name: "Rahul Roy", status: "Active", action: "" },
];

function ProjectManagersPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Project Managers"
      subtitle="Manage project manager records here."
      searchPlaceholder="Search project managers..."
      actionLabel="Add Project Manager"
      columns={["ID", "Name", "Status", "Action"]}
      rows={rows}
    />
  );
}

export default ProjectManagersPage;
