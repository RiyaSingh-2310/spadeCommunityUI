import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CheckCircle2, Globe, ListChecks } from "lucide-react";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import {
  listScreeningRecords,
  updateScreeningQuestionStatus,
} from "../../../services/screening/screeningQuestionsApi";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

function computeSummaryStats(items = [], total = 0) {
  const active = items.filter((row) => String(row.status).toLowerCase() === "active").length;
  const inactive = items.filter((row) => String(row.status).toLowerCase() === "inactive").length;
  const languages = new Set(items.map((row) => row.language).filter(Boolean)).size;

  return {
    total: total || items.length,
    active,
    inactive,
    languages,
  };
}

function QuestionsListPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();

  const {
    rows,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh,
  } = useApiListing({
    fetchFn: listScreeningRecords,
    initialPageSize: DEFAULT_PAGE_SIZE,
    preserveRowOrder: true,
  });
  useListingRefresh(refresh);

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [summaryStats, setSummaryStats] = useState(null);

  const loadSummaryStats = useCallback(async () => {
    try {
      const data = await listScreeningRecords({ page: 1, limit: 500 });
      const items = data.items ?? [];
      setSummaryStats(computeSummaryStats(items, data.total ?? items.length));
    } catch {
      setSummaryStats(null);
    }
  }, []);

  useEffect(() => {
    loadSummaryStats();
  }, [loadSummaryStats]);

  const handleStatusToggle = async (row) => {
    if (!row?.id || statusUpdatingId != null) return;

    const nextStatus = row.status === "Active" ? "Inactive" : "Active";
    setStatusUpdatingId(row.id);

    try {
      const data = await updateScreeningQuestionStatus(row.id, nextStatus);
      toastApiSuccess(data);
      await refresh();
      await loadSummaryStats();
    } catch (error) {
      toastApiError(error);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleEdit = (row) => {
    navigate(`/user-screening/questions/edit/${row.id}`);
  };

  const summaryCards = useMemo(() => {
    if (!summaryStats) {
      return [
        { icon: ListChecks, label: "Total Questions", value: "—" },
        { icon: CheckCircle2, label: "Active Questions", value: "—" },
        { icon: BookOpen, label: "Inactive Questions", value: "—" },
        { icon: Globe, label: "Languages", value: "—" },
      ];
    }

    return [
      { icon: ListChecks, label: "Total Questions", value: summaryStats.total },
      { icon: CheckCircle2, label: "Active Questions", value: summaryStats.active },
      { icon: BookOpen, label: "Inactive Questions", value: summaryStats.inactive },
      { icon: Globe, label: "Languages", value: summaryStats.languages },
    ];
  }, [summaryStats]);

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Question Library"
      breadcrumbs={[
        { label: "Screening Management" },
        { label: "Question Library" },
      ]}
      // summaryCards={summaryCards}
      searchPlaceholder="Search questions..."
      secondaryActionLabel="Sort Profiling Questions"
      onSecondaryActionClick={() => navigate("/user-screening/questions/sort")}
      actionLabel="Add Profiling Questions"
      onActionClick={() => navigate("/user-screening/questions/add")}
      columns={[
        "S.No",
        "Question Title",
        "Language",
        "Question Type",
        "Sort Order",
        "Status",
        "Action",
      ]}
      rows={rows}
      permissionModule="user_screening_management"
      nowrapAllCells
      rowIdKey="id"
      onEdit={handleEdit}
      onStatusToggle={handleStatusToggle}
      isLoading={isLoading}
      emptyMessage="No questions found"
      onSearch={handleSearch}
      totalRecords={totalRecords}
      serverPaginated
      serverSearch
      paginationPage={currentPage}
      onPaginationPageChange={handlePageChange}
      paginationPageSize={pageSize}
      onPaginationPageSizeChange={handlePageSizeChange}
      showPagination
    />
  );
}

export default QuestionsListPage;
