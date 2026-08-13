import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import TableCard from "../../../components/admin/TableCard";
import { toastApiError } from "../../../services/toast/apiToast";
import {
  createPrescreenGroup,
  getRecordForForm,
  updatePrescreenGroup,
} from "../../../services/questionnaire-group/questionnaireGroupApi";
import { getQuestionnaireOptionsForLanguage } from "../../../services/question-library/questionLibraryApi";
import { PRESCREEN_LANGUAGES } from "../data/prescreenLanguages";
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
  status: STATUS_UI_ACTIVE,
};

function arraysEqual(left = [], right = []) {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].map(String).sort();
  const sortedRight = [...right].map(String).sort();
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

function QuestionnaireCheckboxList({
  options,
  selectedIds,
  onChange,
  disabled,
  isLoading,
  hasLanguage,
}) {
  const allIds = useMemo(() => options.map((option) => String(option.value)), [options]);
  const allSelected =
    allIds.length > 0 && allIds.every((optionId) => selectedIds.includes(optionId));

  const handleSelectAll = () => {
    onChange(allSelected ? [] : allIds);
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

      <div className="max-h-[min(360px,50vh)] space-y-2 overflow-y-auto rounded-xl border border-[var(--admin-input-border)] bg-[var(--admin-header-search-bg)] p-3">
      {options.map((option) => {
        const optionId = String(option.value);
        const checked = selectedIds.includes(optionId);

        return (
          <label
            key={optionId}
            className={`admin-text flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
              checked
                ? "border-[var(--admin-primary-color)]/30 bg-[var(--admin-sidebar-active-bg)] font-medium text-[var(--admin-sidebar-active-text)]"
                : "border-transparent bg-[var(--admin-surface-bg)] hover:border-[var(--admin-input-border)]"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() => {
                const next = checked
                  ? selectedIds.filter((id) => id !== optionId)
                  : [...selectedIds, optionId];
                onChange(next);
              }}
              className="admin-checkbox"
            />
            <span>{option.label}</span>
          </label>
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
  const { readOnly, showSubmit, controlDisabled, canSubmitForm } = useAdminFormAccess(isSubmitting);

  const inputClass = getAdminInputClass();

  const errors = useMemo(
    () => ({
      language: getRequiredError(form.language, "Language"),
      surveyTitle: getRequiredMaxLengthError(form.surveyTitle, "Survey Group Title"),
      prescreenIds:
        form.prescreenIds.length > 0 ? "" : "Select at least one questionnaire",
    }),
    [form]
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

            setQuestionnaireOptions(options);
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
      !arraysEqual(form.prescreenIds, initialSnapshot.prescreenIds)
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
      const payload = isEdit
        ? { ...form, status: initialSnapshot?.status ?? form.status }
        : form;
      const data = isEdit
        ? await updatePrescreenGroup(id, payload)
        : await createPrescreenGroup(form);

      const websiteUrl = String(data?.websiteUrl ?? data?.data?.website_url ?? "").trim();
      const baseMessage =
        String(data?.message ?? "").trim() ||
        (isEdit
          ? "Prescreen group updated successfully."
          : "Prescreen group added successfully.");

      navigate("/prescreen/group", {
        replace: true,
        state: {
          flash: {
            type: "success",
            message: websiteUrl
              ? `${baseMessage} Website URL: ${websiteUrl}`
              : baseMessage,
          },
          refresh: true,
        },
      });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { label: "Questionnaire Group", to: "/prescreen/group" },
  ];

  if (isEdit && isLoadingRecord) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Edit Questionnaire Group"
          breadcrumbs={[...breadcrumbItems, { label: "Edit Questionnaire Group" }]}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text flex items-center gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading survey group...
        </div>
      </div>
    );
  }

  if (isEdit && loadFailed) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Edit Questionnaire Group"
          breadcrumbs={[...breadcrumbItems, { label: "Edit Questionnaire Group" }]}
          isDarkMode={isDarkMode}
        />
        <p className="admin-text-muted text-sm">Survey group not found.</p>
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
        title={isEdit ? "Edit Questionnaire Group" : "Add Survey Group"}
        breadcrumbs={[
          ...breadcrumbItems,
          { label: isEdit ? "Edit Questionnaire Group" : "Add Survey Group" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Survey Group Details" isDarkMode={isDarkMode}>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                Language
                <span className="text-[var(--admin-danger-text)]"> *</span>
              </label>
              <SearchableSelect
                inputClass={inputClass}
                value={form.language}
                onChange={handleLanguageChange}
                onBlur={() => touch("language")}
                options={PRESCREEN_LANGUAGES}
                placeholder="Select Language"
                searchPlaceholder="Search language..."
                aria-label="Select language"
                disabled={controlDisabled || isEdit}
              />
              {showError("language") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("language")}</p>
              )}
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                Survey Group Title
                <span className="text-[var(--admin-danger-text)]"> *</span>
              </label>
              <input
                className={inputClass}
                placeholder="Enter Survey Group Title"
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
                  setField("prescreenIds", prescreenIds);
                  touch("prescreenIds");
                }}
                disabled={controlDisabled || !form.language}
                isLoading={isLoadingQuestionnaires}
                hasLanguage={Boolean(form.language)}
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
