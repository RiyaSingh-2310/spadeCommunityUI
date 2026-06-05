import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useListingPageActions } from "../../shared/hooks/useListingPageActions";
import {
  getDemoGroupProjects,
  getDemoGroupSurveyRow,
} from "../data/groupSurveyData";

const SURVEY_ACTION_LABELS = {
  view: "View",
  edit: "Edit",
  findUser: "Find User",
  userSurveyData: "User Survey Data",
  surveyClone: "Survey Clone",
};

function GroupSurveyProjectsListPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const group = useMemo(() => getDemoGroupSurveyRow(groupId), [groupId]);

  const initialRows = useMemo(() => getDemoGroupProjects(groupId), [groupId]);

  const { rows, onStatusToggle } = useListingPageActions({
    initialRows,
    editPath: "/survey",
  });

  const navigateWithId = (pathBuilder) => (row) => {
    const projectId = row?.id;
    if (projectId == null) return;
    pathBuilder(projectId, row);
  };

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="View Projects"
      subtitle={group.groupProject}
      breadcrumbs={[
        { label: "Group Survey", to: "/survey/group" },
        { label: "View Projects" },
      ]}
      searchPlaceholder="Search projects..."
      columns={[
        "ID",
        "Project Name",
        "Client Code",
        "LOI",
        "IR",
        "Start Date",
        "End Date",
        "Status",
        "Action",
      ]}
      rows={rows}
      rowIdKey="id"
      actionVariant="view-edit"
      showDeleteAction={false}
      editPath="/survey"
      onView={navigateWithId((projectId) =>
        navigate(`/survey/view/${encodeURIComponent(projectId)}`)
      )}
      onEdit={navigateWithId((projectId) =>
        navigate(`/survey/edit/${encodeURIComponent(projectId)}`)
      )}
      onFindUser={navigateWithId((projectId, row) =>
        navigate(`/survey/${encodeURIComponent(projectId)}/find-user`, {
          state: { surveyName: row.projectName },
        })
      )}
      onUserSurveyData={navigateWithId((projectId, row) =>
        navigate(`/survey/${encodeURIComponent(projectId)}/user-survey-data`, {
          state: { surveyName: row.projectName },
        })
      )}
      onSurveyClone={() => {
        // Future implementation: clone survey project
      }}
      surveyActionLabels={SURVEY_ACTION_LABELS}
      onStatusToggle={onStatusToggle}
      permissionModule="group_survey"
      searchFields={[
        "id",
        "projectName",
        "clientCode",
        "loi",
        "ir",
        "startDate",
        "endDate",
      ]}
      nowrapAllCells
    />
  );
}

export default GroupSurveyProjectsListPage;
