import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import ApiManagementTab from "../components/ApiManagementTab";

/** Standalone page for API key management (/api/api-keys). */
function ApiManagementPage({ isDarkMode }) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="API Key Management"
        subtitle="Manage external API credentials and configuration."
        isDarkMode={isDarkMode}
      />
      <ApiManagementTab isDarkMode={isDarkMode} showTitle={false} />
    </div>
  );
}

export default ApiManagementPage;
