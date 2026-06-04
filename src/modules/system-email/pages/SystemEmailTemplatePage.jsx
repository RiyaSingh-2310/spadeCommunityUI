import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { loadEmailTemplates, toListingRows } from "../data/emailTemplatesStore";

function SystemEmailTemplatePage({ isDarkMode }) {
  const navigate = useNavigate();
  const rows = toListingRows(loadEmailTemplates());

  const handleEdit = (row) => {
    navigate(`/system-email/edit/${row.id}`);
  };

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="System Email Template"
      searchPlaceholder="Search email templates..."
      columns={["S.No", "Title", "Action"]}
      rows={rows}
      showStatus={false}
      actionVariant="edit-only"
      showDeleteAction={false}
      onEdit={handleEdit}
      rowIdKey="id"
      permissionModule="system_email_templates"
      nowrapAllCells
    />
  );
}

export default SystemEmailTemplatePage;
