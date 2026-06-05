import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useListingPageActions } from "../../shared/hooks/useListingPageActions";
import {
  GROUP_PROJECT_NAMES,
  GROUP_SURVEY_CLIENT_OPTIONS,
} from "../data/groupSurveyData";

const initialRows = Array.from({ length: 12 }, (_, idx) => {
  const client = GROUP_SURVEY_CLIENT_OPTIONS[idx % GROUP_SURVEY_CLIENT_OPTIONS.length];
  const projectName = GROUP_PROJECT_NAMES[idx % GROUP_PROJECT_NAMES.length];

  return {
    id: `GSV-${41 + idx}`,
    clientName: client.label,
    clientCode: client.value,
    client: client.value,
    projectName,
    groupProject: projectName,
    status: idx % 5 === 0 ? "Inactive" : "Active",
  };
});

function GroupSurveyPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { rows, onStatusToggle } = useListingPageActions({
    initialRows,
    editPath: "/survey/group",
  });

  const getGroupId = (row) => row?.id;

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
      actionVariant="group-survey"
      showDeleteAction={false}
      editPath="/survey/group"
      onEdit={(row) => {
        const id = getGroupId(row);
        if (id == null) return;
        navigate(`/survey/group/edit/${encodeURIComponent(id)}`);
      }}
      onAddProject={(row) => {
        const id = getGroupId(row);
        if (id == null) return;
        navigate(`/survey/group/${encodeURIComponent(id)}/add-project`);
      }}
      onListProjects={(row) => {
        const id = getGroupId(row);
        if (id == null) return;
        navigate(`/survey/group/${encodeURIComponent(id)}/projects`);
      }}
      onStatusToggle={onStatusToggle}
      permissionModule="group_survey"
      searchFields={["clientName", "projectName", "clientCode"]}
      nowrapAllCells
    />
  );
}

export default GroupSurveyPage;
