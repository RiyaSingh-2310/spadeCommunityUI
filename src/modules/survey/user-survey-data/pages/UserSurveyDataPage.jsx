import { useLocation, useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../../components/admin/AdminPageHeader";
import AdminPagination from "../../../../components/admin/AdminPagination";
import DebouncedSearchInput from "../../../../components/admin/DebouncedSearchInput";
import UserSurveyDataTable from "../components/UserSurveyDataTable";
import { useUserSurveyDataList } from "../hooks/useUserSurveyDataList";
import { DEFAULT_SURVEY_DISPLAY_NAME } from "../utils/constants";
import { getGroupSurveyBreadcrumbs } from "../../utils/groupSurveyNavigation";

function UserSurveyDataPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id: surveyId, groupId } = useParams();
  const location = useLocation();
  const isGroupView = Boolean(groupId);
  const surveyName = location.state?.surveyName || DEFAULT_SURVEY_DISPLAY_NAME;

  const {
    query,
    setQuery,
    setDebouncedQuery,
    currentPage,
    setCurrentPage,
    items,
    totalItems,
    totalPages,
    isLoading,
    pageSize,
    setPageSize,
  } = useUserSurveyDataList(surveyId);

  const paginationFooter = (
    <AdminPagination
      isDarkMode={isDarkMode}
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      pageSize={pageSize}
      onPageChange={setCurrentPage}
      onPageSizeChange={setPageSize}
      showWhenEmpty
    />
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Survey Data"
        subtitle={`Survey - ${surveyName}`}
        breadcrumbs={
          isGroupView
            ? getGroupSurveyBreadcrumbs(groupId, { currentLabel: "User Survey Data" })
            : [
                { label: "Projects", to: "/survey" },
                { label: "User Survey Data" },
              ]
        }
        isDarkMode={isDarkMode}
        // rightContent={
        //   <button
        //     type="button"
        //     onClick={() => navigate("/survey")}
        //     className="admin-btn-cancel h-10 rounded-xl px-4 text-sm font-semibold"
        //   >
        //     Back to Survey
        //   </button>
        // }
      />

      <DebouncedSearchInput
        value={query}
        onChange={setQuery}
        onDebouncedChange={setDebouncedQuery}
        placeholder="Search users…"
        isDarkMode={isDarkMode}
        aria-label="Search users"
        maxWidthClass="w-full sm:max-w-md"
      />

      <UserSurveyDataTable
        rows={items}
        isLoading={isLoading}
        isDarkMode={isDarkMode}
        footer={paginationFooter}
      />
    </div>
  );
}

export default UserSurveyDataPage;
