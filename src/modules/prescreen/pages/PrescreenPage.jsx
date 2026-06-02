import ModuleListingPage from "../../shared/components/ModuleListingPage";

const rows = [
  { id: "PR-01", name: "KYC Prescreen", status: "Active", action: "" },
  { id: "PR-02", name: "Compliance Prescreen", status: "Inactive", action: "" },
];

function PrescreenPage({ isDarkMode }) {
  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Prescreen"
      subtitle="Manage prescreen records here."
      searchPlaceholder="Search prescreens..."
      actionLabel="Add Prescreen"
      columns={["ID", "Name", "Status", "Action"]}
      rows={rows}
    />
  );
}

export default PrescreenPage;
