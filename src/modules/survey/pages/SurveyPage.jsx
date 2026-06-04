import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useListingPageActions } from "../../shared/hooks/useListingPageActions";

const CLIENT_CODES = ["CL-1001", "CL-1002", "CL-1003", "CL-1004", "CL-1005"];
const PROJECTS = [
  "Brand Tracker Q2",
  "CX Pulse Study",
  "Product Launch Survey",
  "Employee NPS Wave",
  "Market Sizing Study",
];

const initialRows = Array.from({ length: 12 }, (_, idx) => ({
  id: `SV-${1001 + idx}`,
  projectName: PROJECTS[idx % PROJECTS.length],
  clientCode: CLIENT_CODES[idx % CLIENT_CODES.length],
  startDate: `${String(1 + (idx % 28)).padStart(2, "0")}/03/2026`,
  endDate: `${String(10 + (idx % 18)).padStart(2, "0")}/04/2026`,
  status: idx % 4 === 0 ? "Inactive" : "Active",
}));

function SurveyPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { rows, onStatusToggle } = useListingPageActions({
    initialRows,
    editPath: "/survey",
  });

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Survey"
      subtitle="Manage survey records here."
      searchPlaceholder="Search surveys..."
      actionLabel="Add Survey"
      onActionClick={() => navigate("/survey/add")}
      columns={[
        "ID",
        "Project Name",
        "Client Code",
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
      onView={(row) => {
        const id = row.id;
        if (id == null) return;
        navigate(`/survey/view/${encodeURIComponent(id)}`);
      }}
      onFindUser={(row) => {
        const id = row.id;
        if (id == null) return;
        navigate(`/survey/${encodeURIComponent(id)}/find-user`, {
          state: {
            surveyName: row.projectName || "Lifestyle Evolution India",
          },
        });
      }}
      onUserSurveyData={(row) => {
        const id = row.id;
        if (id == null) return;
        navigate(`/survey/${encodeURIComponent(id)}/user-survey-data`, {
          state: {
            surveyName: row.projectName || "Lifestyle Evaluation India",
          },
        });
      }}
      onSurveyClone={() => {
        // Future implementation: clone survey project
      }}
      onStatusToggle={onStatusToggle}
      permissionModule="survey"
      searchFields={[
        "id",
        "projectName",
        "clientCode",
        "startDate",
        "endDate",
      ]}
      nowrapAllCells
    />
  );
}

export default SurveyPage;
