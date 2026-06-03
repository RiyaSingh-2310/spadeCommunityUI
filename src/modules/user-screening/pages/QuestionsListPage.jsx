import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import {
  deleteProfilingQuestion,
  loadProfilingQuestions,
  toListingRows,
  updateProfilingQuestionStatus,
} from "../data/profilingQuestionsStore";

function QuestionsListPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [listVersion, setListVersion] = useState(0);
  const rows = toListingRows(loadProfilingQuestions());
  void listVersion;

  const bumpList = () => setListVersion((v) => v + 1);

  const handleStatusToggle = (row) => {
    const nextStatus =
      String(row.status).toLowerCase() === "active" ? "Inactive" : "Active";
    updateProfilingQuestionStatus(row.id, nextStatus);
    bumpList();
  };

  const handleEdit = (row) => {
    navigate(`/user-screening/questions/edit/${row.id}`);
  };

  const handleDelete = (row) => {
    const confirmed = window.confirm(
      `Delete "${row.questionTitle}"? This action cannot be undone.`
    );
    if (!confirmed) return;
    deleteProfilingQuestion(row.id);
    bumpList();
  };

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="List of All Questions"
      searchPlaceholder="Search questions..."
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
      nowrapAllCells
      rowIdKey="id"
      onEdit={handleEdit}
      onDelete={handleDelete}
      onStatusToggle={handleStatusToggle}
    />
  );
}

export default QuestionsListPage;
