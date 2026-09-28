import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GripVertical, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import LanguageSelect from "../../../components/admin/LanguageSelect";
import TableCard from "../../../components/admin/TableCard";
import toast from "../../../services/toast/toast";
import { resolveApiToastMessage, toastApiError } from "../../../services/toast/apiToast";
import {
  createPrescreenGroup,
  getRecordForForm,
  surveyGroupTitleExists,
  updatePrescreenGroup,
} from "../../../services/questionnaire-group/questionnaireGroupApi";
import {
  isSurveyGroupTitleDuplicateError,
  SURVEY_GROUP_TITLE_DUPLICATE_MESSAGE,
} from "../utils/surveyGroupTitle";
import { getQuestionnaireOptionsForLanguage } from "../../../services/question-library/questionLibraryApi";
import { useAdminFormAccess } from "../../permissions/FormAccessContext";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { STATUS_UI_ACTIVE } from "../../shared/utils/statusLabels";
import {
  getRequiredError,
  getRequiredMaxLengthError,
  isFormValidForFields,
  limitTextInput,
  NAME_FIELD_MAX_LENGTH,
} from "../../shared/utils/validation";

const PRESCREEN_GROUP_FORM_FIELDS = ["language", "surveyTitle", "prescreenIds"];

const PRESCREEN_GROUP_REQUIRED_FIELDS = ["language", "surveyTitle", "prescreenIds"];

const EMPTY_FORM = {
  language: "",
  surveyTitle: "",
  prescreenIds: [],
  questionSortOrders: {},
  status: STATUS_UI_ACTIVE,
};

function sortOptionsBySelectedOrder(options, selectedIds) {
  const rank = new Map((selectedIds ?? []).map((id, index) => [String(id), index]));
  return [...options].sort((left, right) => {
    const leftRank = rank.has(String(left.value))
      ? rank.get(String(left.value))
      : Number.MAX_SAFE_INTEGER;
    const rightRank = rank.has(String(right.value))
      ? rank.get(String(right.value))
      : Number.MAX_SAFE_INTEGER;
    return leftRank - rightRank;
  });
}

function sortOrdersMatchSelection(selectedIds, sortOrders) {
  const ranked = [...selectedIds].sort((left, right) => {
    const leftOrder = sortOrders?.[String(left)];
    const rightOrder = sortOrders?.[String(right)];
    const leftMissing = leftOrder == null || leftOrder === "";
    const rightMissing = rightOrder == null || rightOrder === "";
    if (leftMissing && rightMissing) return 0;
    if (leftMissing) return 1;
    if (rightMissing) return -1;
    return Number(leftOrder) - Number(rightOrder);
  });
  return selectedIds.every((id, index) => String(id) === String(ranked[index]));
}

function nextQuestionSortOrders(selectedIds, previous = {}) {
  const hasStoredOrder = selectedIds.every(
    (id) => previous[String(id)] != null && previous[String(id)] !== ""
  );
  if (hasStoredOrder && sortOrdersMatchSelection(selectedIds, previous)) {
    return Object.fromEntries(selectedIds.map((id) => [String(id), Number(previous[String(id)])]));
  }

  return Object.fromEntries(selectedIds.map((id, index) => [String(id), index]));
}

function arraysEqual(left = [], right = []) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => String(value) === String(right[index]));
}

function reorderList(items, fromIndex, toIndex) {
  if (fromIndex === toIndex) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function orderSelectedIds(options, selectedIds) {
  const selected = new Set((selectedIds ?? []).map(String));
  const ordered = options
    .map((option) => String(option.value))
    .filter((id) => selected.has(id));
  (selectedIds ?? []).forEach((id) => {
    const value = String(id);
    if (!ordered.includes(value)) ordered.push(value);
  });
  return ordered;
}

function QuestionnaireCheckboxList({
  options,
  selectedIds,
  onChange,
  onReorder,
  disabled,
  isLoading,
  hasLanguage,
  isDarkMode,
}) {
  const allIds = useMemo(() => options.map((option) => String(option.value)), [options]);
  const allSelected =
    allIds.length > 0 && allIds.every((optionId) => selectedIds.includes(optionId));
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const rowRefs = useRef([]);
  const scrollRef = useRef(null);
  const pointerYRef = useRef(0);
  const dragIndexRef = useRef(null);

  const findIndexAtY = useCallback((clientY) => {
    for (let index = 0; index < rowRefs.current.length; index += 1) {
      const node = rowRefs.current[index];
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return index;
    }
    return Math.max(0, rowRefs.current.length - 1);
  }, []);

  const autoScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || dragIndexRef.current == null) return;
    const rect = container.getBoundingClientRect();
    const y = pointerYRef.current;
    if (y < rect.top + 48) container.scrollTop -= 10;
    else if (y > rect.bottom - 48) container.scrollTop += 10;
  }, []);

  useEffect(() => {
    if (dragIndex == null) return undefined;
    const interval = window.setInterval(autoScroll, 16);
    return () => window.clearInterval(interval);
  }, [dragIndex, autoScroll]);

  const endDrag = useCallback(() => {
    const from = dragIndexRef.current;
    const to = overIndex;
    dragIndexRef.current = null;
    setDragIndex(null);
    setOverIndex(null);
    if (from == null || to == null || from === to) return;
    const nextOptions = reorderList(options, from, to);
    onReorder?.(nextOptions);
    onChange(orderSelectedIds(nextOptions, selectedIds));
  }, [onChange, onReorder, options, overIndex, selectedIds]);

  const handleSelectAll = () => {
    onChange(allSelected ? [] : orderSelectedIds(options, allIds));
  };

  const handlePointerDown = (event, index) => {
    if (disabled || event.button > 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragIndexRef.current = index;
    setDragIndex(index);
    setOverIndex(index);
    pointerYRef.current = event.clientY;
  };

  if (!hasLanguage) {
    return (
      <p className="admin-text-muted rounded-xl border border-dashed border-[var(--admin-input-border)] px-4 py-6 text-sm">
        Select a language first to load questionnaires.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[var(--admin-input-border)] px-4 py-6 text-sm">
        <Loader2 size={16} className="animate-spin text-[#10a950]" />
        <span className="admin-text-muted">Loading questionnaires...</span>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <p className="admin-text-muted rounded-xl border border-dashed border-[var(--admin-input-border)] px-4 py-6 text-sm">
        No questionnaires found for this language.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <label
        className={`admin-text flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--admin-input-border)] bg-[var(--admin-surface-bg)] px-3 py-2.5 text-sm font-semibold transition ${
          disabled ? "cursor-not-allowed opacity-60" : "hover:bg-[var(--admin-sidebar-hover-bg)]"
        }`}
      >
        <input
          type="checkbox"
          checked={allSelected}
          disabled={disabled}
          onChange={handleSelectAll}
          className="admin-checkbox"
        />
        <span>Select All</span>
      </label>

      <div
        ref={scrollRef}
        className="sortable-question-list max-h-[min(360px,50vh)] space-y-2 overflow-y-auto rounded-xl border border-[var(--admin-input-border)] bg-[var(--admin-header-search-bg)] p-3"
      >
      {options.map((option, index) => {
        const optionId = String(option.value);
        const checked = selectedIds.includes(optionId);
        const isDragging = dragIndex === index;
        const isDropTarget = overIndex === index && dragIndex != null && dragIndex !== index;

        return (
          <div
            key={optionId}
            ref={(node) => {
              rowRefs.current[index] = node;
            }}
            className={`sortable-question-row admin-text flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
              isDragging
                ? "sortable-question-row-dragging opacity-60"
                : isDropTarget
                  ? "sortable-question-row-over"
                  : checked
                    ? "border-[var(--admin-primary-color)]/30 bg-[var(--admin-sidebar-active-bg)] font-medium text-[var(--admin-sidebar-active-text)]"
                    : "border-transparent bg-[var(--admin-surface-bg)]"
            } ${disabled ? "opacity-60" : ""}`}
          >
            <button
              type="button"
              aria-label={`Drag to reorder ${option.label}`}
              disabled={disabled}
              onPointerDown={(event) => handlePointerDown(event, index)}
              onPointerMove={(event) => {
                if (dragIndexRef.current == null) return;
                pointerYRef.current = event.clientY;
                setOverIndex(findIndexAtY(event.clientY));
              }}
              onPointerUp={(event) => {
                if (dragIndexRef.current == null) return;
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
                endDrag();
              }}
              onPointerCancel={() => {
                dragIndexRef.current = null;
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={`sortable-question-handle inline-flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-lg border transition active:cursor-grabbing ${
                disabled ? "cursor-not-allowed opacity-50" : ""
              } ${
                isDarkMode
                  ? "border-[#344662] text-[#9fb0c8] hover:bg-[#1f3047]"
                  : "border-[#d8e3ef] text-[#5e718a] hover:bg-[#eef4fb]"
              }`}
            >
              <GripVertical size={16} />
            </button>
            <label className={`flex min-w-0 flex-1 cursor-pointer items-center gap-3 ${disabled ? "cursor-not-allowed" : ""}`}>
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => {
                  const next = checked
                    ? selectedIds.filter((id) => id !== optionId)
                    : [...selectedIds, optionId];
                  onChange(orderSelectedIds(options, next));
                }}
                className="admin-checkbox"
              />
              <span>{option.label}</span>
            </label>
          </div>
        );
      })}
      </div>
    </div>
  );
}

function AddPrescreenGroupPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [questionnaireOptions, setQuestionnaireOptions] = useState([]);
  const [isLoadingQuestionnaires, setIsLoadingQuestionnaires] = useState(false);
  const [titleTaken, setTitleTaken] = useState(false);
  const { readOnly, showSubmit, controlDisabled, canSubmitForm } = useAdminFormAccess(isSubmitting);

  const inputClass = getAdminInputClass();

  const errors = useMemo(
    () => ({
      language: getRequiredError(form.language, "Language"),
      surveyTitle:
        getRequiredMaxLengthError(form.surveyTitle, "Pre-Screen Group Title") ||
        (titleTaken ? SURVEY_GROUP_TITLE_DUPLICATE_MESSAGE : ""),
      prescreenIds:
        form.prescreenIds.length > 0 ? "" : "Select at least one questionnaire",
    }),
    [form, titleTaken]
  );

  const { showError, touch, validateSubmit, resetValidation } = useFormValidation({
    errors,
    fields: PRESCREEN_GROUP_FORM_FIELDS,
  });

  useEffect(() => {
    if (!isEdit || !id) return undefined;

    let cancelled = false;

    const loadPrescreenGroup = async () => {
      resetValidation();
      setIsLoadingRecord(true);
      setLoadFailed(false);

      try {
        const mapped = await getRecordForForm(id);
        if (cancelled) return;
        const prescreenIds = (mapped.prescreenIds ?? []).map(String);

        if (mapped.language) {
          setIsLoadingQuestionnaires(true);
          try {
            const options = await getQuestionnaireOptionsForLanguage(
              mapped.language,
              mapped.language
            );
            if (cancelled) return;

            prescreenIds.forEach((selectedId) => {
              const linkedQuestion = mapped.linkedQuestions?.find(
                (item) => String(item.id) === selectedId
              );
              if (!options.some((option) => String(option.value) === selectedId)) {
                options.unshift({
                  value: selectedId,
                  label: linkedQuestion?.questionTitle || `Question #${selectedId}`,
                });
              }
            });

            setQuestionnaireOptions(sortOptionsBySelectedOrder(options, prescreenIds));
          } finally {
            if (!cancelled) setIsLoadingQuestionnaires(false);
          }
        }

        const snapshot = {
          ...mapped,
          prescreenIds,
        };

        setForm(snapshot);
        setInitialSnapshot(snapshot);
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoadingRecord(false);
      }
    };

    loadPrescreenGroup();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, resetValidation]);

  useEffect(() => {
    if (isEdit || !form.language) {
      if (!form.language) setQuestionnaireOptions([]);
      return undefined;
    }

    let cancelled = false;

    const loadQuestionnaires = async () => {
      setIsLoadingQuestionnaires(true);
      try {
        const options = await getQuestionnaireOptionsForLanguage(form.language, form.language);
        if (!cancelled) setQuestionnaireOptions(options);
      } catch {
        if (!cancelled) setQuestionnaireOptions([]);
      } finally {
        if (!cancelled) setIsLoadingQuestionnaires(false);
      }
    };

    loadQuestionnaires();
    return () => {
      cancelled = true;
    };
  }, [form.language, isEdit]);

  const isDirty = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false;
    return (
      form.surveyTitle !== initialSnapshot.surveyTitle ||
      !arraysEqual(form.prescreenIds, initialSnapshot.prescreenIds) ||
      !arraysEqual(
        form.prescreenIds.map((id) => form.questionSortOrders?.[String(id)]),
        initialSnapshot.prescreenIds.map((id) => initialSnapshot.questionSortOrders?.[String(id)])
      )
    );
  }, [isEdit, initialSnapshot, form]);

  const canSubmit =
    canSubmitForm &&
    isFormValidForFields(errors, PRESCREEN_GROUP_REQUIRED_FIELDS) &&
    !isSubmitting &&
    (!isEdit || isDirty) &&
    !isLoadingRecord &&
    !loadFailed;

  const setField = (key, value) => {
    if (key === "surveyTitle") setTitleTaken(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLanguageChange = (language) => {
    setForm((prev) => ({
      ...prev,
      language,
      prescreenIds: isEdit ? prev.prescreenIds : [],
    }));
    touch("language");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      readOnly ||
      !showSubmit ||
      !validateSubmit() ||
      !isFormValidForFields(errors, PRESCREEN_GROUP_REQUIRED_FIELDS) ||
      (isEdit && !isDirty)
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (titleTaken) {
        toast.error(SURVEY_GROUP_TITLE_DUPLICATE_MESSAGE);
        return;
      }

      const exists = await surveyGroupTitleExists(form.surveyTitle, {
        excludeId: isEdit ? id : undefined,
        language: form.language,
      });
      if (exists) {
        setTitleTaken(true);
        toast.error(SURVEY_GROUP_TITLE_DUPLICATE_MESSAGE);
        return;
      }

      const payload = isEdit
        ? { ...form, status: initialSnapshot?.status ?? form.status }
        : form;
      const data = isEdit
        ? await updatePrescreenGroup(id, payload)
        : await createPrescreenGroup(form);

      const baseMessage =
        String(data?.message ?? "").trim() ||
        (isEdit
          ? "Questionnaire group updated successfully."
          : "Questionnaire groups added successfully.");

      navigate("/prescreen/group", {
        replace: true,
        state: {
          flash: {
            type: "success",
            message: baseMessage,
          },
          refresh: true,
        },
      });
    } catch (error) {
      if (isSurveyGroupTitleDuplicateError(error)) {
        setTitleTaken(true);
        toast.error(
          resolveApiToastMessage(error, SURVEY_GROUP_TITLE_DUPLICATE_MESSAGE)
        );
      } else {
        toastApiError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { label: "Pre-Screen Group", to: "/prescreen/group" },
  ];

  if (isEdit && isLoadingRecord) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Edit Pre-Screen Group"
          breadcrumbs={[...breadcrumbItems, { label: "Edit Pre-Screen Group" }]}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text flex items-center gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading pre-screen group...
        </div>
      </div>
    );
  }

  if (isEdit && loadFailed) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Edit Pre-Screen Group"
          breadcrumbs={[...breadcrumbItems, { label: "Edit Pre-Screen Group" }]}
          isDarkMode={isDarkMode}
        />
        <p className="admin-text-muted text-sm">Pre-screen group not found.</p>
        <button
          type="button"
          onClick={() => navigate("/prescreen/group")}
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
        title={isEdit ? "Edit Pre-Screen Group" : "Add Pre-Screen Group"}
        breadcrumbs={[
          ...breadcrumbItems,
          { label: isEdit ? "Edit Pre-Screen Group" : "Add Pre-Screen Group" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Pre-Screen Group Details" isDarkMode={isDarkMode}>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                Language
                <span className="text-[var(--admin-danger-text)]"> *</span>
              </label>
              <LanguageSelect
                inputClass={inputClass}
                value={form.language}
                onChange={handleLanguageChange}
                onBlur={() => touch("language")}
                disabled={controlDisabled || isEdit}
              />
              {showError("language") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("language")}</p>
              )}
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                Pre-Screen Group Title
                <span className="text-[var(--admin-danger-text)]"> *</span>
              </label>
              <input
                className={inputClass}
                placeholder="Enter Pre-Screen Group Title"
                value={form.surveyTitle}
                maxLength={NAME_FIELD_MAX_LENGTH}
                onChange={(e) =>
                  setField("surveyTitle", limitTextInput(e.target.value, NAME_FIELD_MAX_LENGTH))
                }
                onBlur={() => touch("surveyTitle")}
                disabled={controlDisabled}
              />
              {showError("surveyTitle") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("surveyTitle")}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="admin-text mb-2 block text-sm font-semibold">
                Select Questionnaire
                <span className="text-[var(--admin-danger-text)]"> *</span>
              </label>
              <QuestionnaireCheckboxList
                options={questionnaireOptions}
                selectedIds={form.prescreenIds}
                onChange={(prescreenIds) => {
                  setForm((prev) => ({
                    ...prev,
                    prescreenIds,
                    questionSortOrders: nextQuestionSortOrders(
                      prescreenIds,
                      prev.questionSortOrders
                    ),
                  }));
                  touch("prescreenIds");
                }}
                onReorder={setQuestionnaireOptions}
                disabled={controlDisabled || !form.language}
                isLoading={isLoadingQuestionnaires}
                hasLanguage={Boolean(form.language)}
                isDarkMode={isDarkMode}
              />
              {showError("prescreenIds") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">
                  {showError("prescreenIds")}
                </p>
              )}
            </div>
          </div>
          <div className="admin-form-actions flex flex-wrap items-center gap-3 pt-2">
            {showSubmit && !readOnly && (
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? (isEdit ? "Updating..." : "Submitting...") : isEdit ? "Update" : "Submit"}
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/prescreen/group")}
              disabled={isSubmitting}
              className={getAdminCancelButtonClass()}
            >
              Cancel
            </button>
          </div>
        </form>
      </TableCard>
    </div>
  );
}

export default AddPrescreenGroupPage;
