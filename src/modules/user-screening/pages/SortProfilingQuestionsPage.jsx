import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import TableCard from "../../../components/admin/TableCard";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass } from "../../shared/utils/formStyles";
import SortableProfilingQuestionList from "../components/SortableProfilingQuestionList";
import {
  loadProfilingQuestions,
  saveProfilingQuestionOrder,
} from "../data/profilingQuestionsStore";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

function SortProfilingQuestionsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { readOnly, showSubmit } = useFormAccess();

  const initialItems = useMemo(() => loadProfilingQuestions(), []);
  const [items, setItems] = useState(initialItems);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasChanges = useMemo(() => {
    return items.some((item, index) => item.id !== initialItems[index]?.id);
  }, [items, initialItems]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!hasChanges) {
      navigate("/user-screening/questions", {
        replace: true,
        state: { refresh: true },
      });
      return;
    }

    setIsSubmitting(true);
    try {
      saveProfilingQuestionOrder(items);
      toastApiSuccess({ message: "Profiling question order updated successfully." });
      navigate("/user-screening/questions", {
        replace: true,
        state: { refresh: true },
      });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/user-screening/questions");
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Sort User Prescreen Questionnaire"
        breadcrumbs={[
          { label: "Screening Management", to: "/user-screening/questions" },
          { label: "List of All Questions", to: "/user-screening/questions" },
          { label: "Sort Questions" },
        ]}
        isDarkMode={isDarkMode}
      />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <TableCard title="Profiling Questions Order" isDarkMode={isDarkMode}>
          <p className="admin-text-muted mb-4 text-sm">
            Drag questions using the handle to change their display order.
          </p>
          <SortableProfilingQuestionList
            items={items}
            onChange={setItems}
            isDarkMode={isDarkMode}
            disabled={fieldDisabled(readOnly, isSubmitting)}
          />
        </TableCard>

        <div className="admin-form-actions flex flex-wrap items-center gap-3">
          {showSubmit && !readOnly && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? "Saving..." : "Submit"}
            </button>
          )}
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className={getAdminCancelButtonClass()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default SortProfilingQuestionsPage;
