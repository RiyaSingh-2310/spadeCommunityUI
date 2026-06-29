import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import TableCard from "../../../components/admin/TableCard";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass } from "../../shared/utils/formStyles";
import SortableProfilingQuestionList from "../components/SortableProfilingQuestionList";
import {
  getRecords,
  getScreeningRowId,
  updateScreeningSortOrder,
} from "../../../services/screening/screeningQuestionsApi";
import { toastApiError } from "../../../services/toast/apiToast";

function SortProfilingQuestionsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { readOnly, showSubmit } = useFormAccess();

  const [items, setItems] = useState([]);
  const [initialItems, setInitialItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadQuestions = async () => {
      setIsLoading(true);
      setLoadFailed(false);

      try {
        const data = await getRecords({ page: 1, limit: 500 });
        if (cancelled) return;

        const mapped = (data.items ?? []).map((row) => ({
          id: getScreeningRowId(row),
          questionTitle: row.questionTitle ?? row.title ?? "",
          sortOrder: Number(row.sortOrder ?? 0),
        }));

        setItems(mapped);
        setInitialItems(mapped);
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadQuestions();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasChanges = useMemo(() => {
    return items.some((item, index) => item.id !== initialItems[index]?.id);
  }, [items, initialItems]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!hasChanges) {
      navigate("/user-screening/questions", { replace: true });
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await updateScreeningSortOrder(
        items.map((item, index) => ({
          id: item.id,
          sort_order: index,
        }))
      );
      const successMessage = data?.message || "Question order updated.";
      navigate("/user-screening/questions", {
        replace: true,
        state: {
          flash: {
            type: "success",
            message: successMessage,
          },
        },
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

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#10a950]" />
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Sort User Prescreen Questionnaire"
          breadcrumbs={[
            { label: "Panelist", to: "/user-screening/questions" },
            { label: "Panel Questionnaire", to: "/user-screening/questions" },
            { label: "Sort Questions" },
          ]}
          isDarkMode={isDarkMode}
        />
        <p className="admin-text-muted text-sm">Unable to load questions.</p>
        <button
          type="button"
          onClick={() => navigate("/user-screening/questions")}
          className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Sort User Prescreen Questionnaire"
        breadcrumbs={[
          { label: "Panelist", to: "/user-screening/questions" },
          { label: "Panel Questionnaire", to: "/user-screening/questions" },
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
