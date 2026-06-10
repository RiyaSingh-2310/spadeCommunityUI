import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError } from "../../../services/toast/apiToast";
import { getRecords } from "../services/surveyApi";

function SurveyPage({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  useFlashMessage();
  const [rows, setRows] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSurveys = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRecords();
      setRows(data.items);
      setTotalRecords(data.total ?? data.count ?? data.items.length);
    } catch (error) {
      toastApiError(error);
      setRows([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchSurveys();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, fetchSurveys]);

  const handleStatusToggle = (row) => {
    if (!row?.recordId) return;
    setRows((prev) =>
      prev.map((item) =>
        String(item.recordId) === String(row.recordId)
          ? {
              ...item,
              status:
                String(item.status).toLowerCase() === "active" ? "Inactive" : "Active",
            }
          : item
      )
    );
  };

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
      rowIdKey="recordId"
      actionVariant="view-edit"
      showDeleteAction={false}
      editPath="/survey"
      onView={(row) => {
        const id = row.recordId;
        if (id == null) return;
        navigate(`/survey/view/${encodeURIComponent(id)}`);
      }}
      onFindUser={(row) => {
        const id = row.recordId;
        if (id == null) return;
        navigate(`/survey/${encodeURIComponent(id)}/find-user`, {
          state: {
            surveyName: row.projectName || "Lifestyle Evolution India",
          },
        });
      }}
      onUserSurveyData={(row) => {
        const id = row.recordId;
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
      onStatusToggle={handleStatusToggle}
      permissionModule="survey"
      searchFields={[
        "id",
        "projectName",
        "clientCode",
        "startDate",
        "endDate",
      ]}
      isLoading={isLoading}
      emptyMessage="No Data Available"
      totalRecords={totalRecords}
      pageSize={DEFAULT_PAGE_SIZE}
      showPagination
      nowrapAllCells
    />
  );
}

export default SurveyPage;
