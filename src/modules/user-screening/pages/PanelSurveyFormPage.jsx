import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import TableCard from "../../../components/admin/TableCard";
import {
  getAdminCancelButtonClass,
  getAdminInputClass,
} from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  getRequiredError,
  isFormValid,
} from "../../shared/utils/validation";
import { toastApiError } from "../../../services/toast/apiToast";
import {
  createPanelSurvey,
  decodeQuestionId,
  getCreateSurveyQuestionOptions,
  getPanelSurveyById,
  getRecord,
  mapPanelSurveyToForm,
  mapScreeningRecordToQuestionItem,
  updatePanelSurvey,
} from "../../../services/screening/screeningQuestionsApi";
import { useAdminFormAccess } from "../../permissions/FormAccessContext";
import { LANGUAGES } from "../data/profilingQuestionsStore";

const SURVEY_FORM_FIELDS = ["language", "questionTitle", "questions"];

const QUESTIONS_LIST_BORDER =
  "rounded-xl border border-[var(--admin-input-border)] bg-[var(--admin-input-bg)]";

const LIST_PATH = "/user-screening/panel-survey";

function buildEmptyForm() {
  return {
    language: "",
    questionTitle: "",
    questions: [],
    status: "Active",
  };
}

function hasQuestionContent(question) {
  return Boolean(String(question?.questionText ?? "").trim());
}

function PanelSurveyFormPage({ isDarkMode, mode = "add" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";
  const { readOnly: permissionReadOnly, canSubmitForm } = useAdminFormAccess();
  const readOnly = permissionReadOnly;
  const [form, setForm] = useState(buildEmptyForm);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [languageQuestionOptions, setLanguageQuestionOptions] = useState([]);
  const [isLoadingLanguageQuestions, setIsLoadingLanguageQuestions] = useState(false);
  const [addingQuestionId, setAddingQuestionId] = useState(null);
  const inputClass = getAdminInputClass();

  useEffect(() => {
    const language = String(form.language ?? "").trim();
    if (!language) {
      setLanguageQuestionOptions([]);
      return undefined;
    }

    let cancelled = false;

    const loadLanguageQuestions = async () => {
      setIsLoadingLanguageQuestions(true);
      try {
        const options = await getCreateSurveyQuestionOptions(language);
        if (cancelled) return;
        setLanguageQuestionOptions(options);
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLanguageQuestionOptions([]);
      } finally {
        if (!cancelled) setIsLoadingLanguageQuestions(false);
      }
    };

    loadLanguageQuestions();
    return () => {
      cancelled = true;
    };
  }, [form.language]);

  const availableLanguageQuestions = useMemo(() => {
    const selectedKeys = new Set(
      form.questions.flatMap((question) => {
        const keys = [];
        if (question.libraryQuestionId != null) keys.push(String(question.libraryQuestionId));
        if (question.sourceKey != null) keys.push(String(question.sourceKey));
        const text = String(question.questionText ?? "").trim();
        if (text) keys.push(text);
        return keys;
      })
    );

    return languageQuestionOptions.filter((option) => {
      const optionId = String(option.value ?? "");
      const label = String(option.label ?? "").trim();
      return !selectedKeys.has(optionId) && !selectedKeys.has(label);
    });
  }, [form.questions, languageQuestionOptions]);

  useEffect(() => {
    const normalizedId = decodeQuestionId(id);
    if (!isEdit || !normalizedId) {
      setForm(buildEmptyForm());
      setInitialSnapshot(null);
      setActiveQuestionIndex(0);
      setIsLoadingRecord(false);
      setLoadFailed(false);
      return undefined;
    }

    let cancelled = false;

    const loadSurvey = async () => {
      setIsLoadingRecord(true);
      setLoadFailed(false);

      try {
        const record = await getPanelSurveyById(normalizedId);
        if (cancelled) return;

        if (!record) {
          setLoadFailed(true);
          return;
        }

        const snapshot = await mapPanelSurveyToForm(record);
        if (cancelled) return;

        setForm(snapshot);
        setInitialSnapshot(snapshot);
        setActiveQuestionIndex(0);
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoadingRecord(false);
      }
    };

    loadSurvey();
    return () => {
      cancelled = true;
    };
  }, [isEdit, id]);

  useEffect(() => {
    if (activeQuestionIndex >= form.questions.length) {
      setActiveQuestionIndex(Math.max(0, form.questions.length - 1));
    }
  }, [activeQuestionIndex, form.questions.length]);

  const errors = useMemo(
    () => ({
      language: getRequiredError(form.language, "Language"),
      questionTitle: getRequiredError(form.questionTitle, "Survey Title"),
      questions:
        form.questions.length === 0
          ? "Add at least one question"
          : form.questions.some((question) => !hasQuestionContent(question))
            ? "Complete all question fields"
            : "",
    }),
    [form]
  );

  const { showError, touch, validateSubmit, resetValidation } = useFormValidation({
    errors,
    fields: SURVEY_FORM_FIELDS,
  });

  const isDirty = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false;
    return JSON.stringify(form) !== JSON.stringify(initialSnapshot);
  }, [isEdit, initialSnapshot, form]);

  const canSubmit =
    canSubmitForm &&
    isFormValid(errors) &&
    (!isEdit || isDirty) &&
    !isSubmitting &&
    !isLoadingRecord &&
    !loadFailed &&
    !readOnly;

  const removeQuestionAtIndex = (index) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, questionIndex) => questionIndex !== index),
    }));
    setActiveQuestionIndex((prev) => {
      if (index < prev) return prev - 1;
      if (prev >= form.questions.length - 1) return Math.max(0, form.questions.length - 2);
      return prev;
    });
  };

  const handleAddAvailableQuestion = async (option) => {
    const libraryId = option?.libraryQuestionId ?? option?.value;
    if (libraryId == null) return;

    setAddingQuestionId(String(libraryId));
    try {
      let record = option.record;
      try {
        record = await getRecord(libraryId);
      } catch {
        // Fall back to the language-list payload when detail is unavailable.
      }

      const mapped = mapScreeningRecordToQuestionItem(record);
      const nextQuestion = {
        ...mapped,
        recordId: undefined,
        libraryQuestionId: libraryId,
        sourceKey: String(libraryId),
      };

      setForm((prev) => ({
        ...prev,
        questions: [...prev.questions, nextQuestion],
      }));

      setActiveQuestionIndex(form.questions.length);
    } catch (error) {
      toastApiError(error);
    } finally {
      setAddingQuestionId(null);
    }
  };

  const moveQuestion = (direction) => {
    setForm((prev) => {
      const targetIndex = activeQuestionIndex + direction;
      if (targetIndex < 0 || targetIndex >= prev.questions.length) return prev;
      const nextQuestions = [...prev.questions];
      [nextQuestions[activeQuestionIndex], nextQuestions[targetIndex]] = [
        nextQuestions[targetIndex],
        nextQuestions[activeQuestionIndex],
      ];
      return { ...prev, questions: nextQuestions };
    });
    setActiveQuestionIndex((prev) => prev + direction);
  };

  const handleClearForm = () => {
    setForm(buildEmptyForm());
    setInitialSnapshot(null);
    setActiveQuestionIndex(0);
    setLanguageQuestionOptions([]);
    resetValidation();
  };

  const buildSubmitPayload = () => ({
    surveyTitle: form.questionTitle.trim(),
    language: form.language.trim(),
    questions: form.questions,
    status: form.status,
  });

  const handleSubmit = async () => {
    if (!validateSubmit() || !canSubmit || (isEdit && !isDirty)) return;

    setIsSubmitting(true);
    try {
      const payload = buildSubmitPayload();
      const data = isEdit
        ? await updatePanelSurvey(decodeQuestionId(id), payload)
        : await createPanelSurvey(payload);

      const successMessage =
        data?.message || (isEdit ? "Panel survey updated." : "Panel survey created.");

      navigate(LIST_PATH, {
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

  if (isEdit && isLoadingRecord) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#10a950]" />
      </div>
    );
  }

  if (isEdit && loadFailed) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Edit Panel Survey" isDarkMode={isDarkMode} />
        <p className="admin-text-muted text-sm">Panel survey not found.</p>
        <button
          type="button"
          onClick={() => navigate(LIST_PATH)}
          className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white"
        >
          Back to List
        </button>
      </div>
    );
  }

  const pageTitle = isEdit ? "Edit Panel Survey" : "Add Panel Survey";

  return (
    <div className="admin-page-root min-w-0 space-y-6">
      <AdminPageHeader
        title={pageTitle}
        breadcrumbs={[
          { label: "Panelist", to: "/community-users" },
          { label: "Panel Survey", to: LIST_PATH },
          { label: pageTitle },
        ]}
        isDarkMode={isDarkMode}
      />

      <TableCard title="Survey Details" isDarkMode={isDarkMode}>
        <form className="admin-form-root min-w-0 space-y-6" onSubmit={(event) => event.preventDefault()} noValidate>
          <div className="admin-form-grid-2">
            <FormField label="Language" required error={showError("language")}>
              <SearchableSelect
                inputClass={inputClass}
                value={form.language}
                disabled={readOnly}
                onChange={(language) => {
                  setForm((prev) => ({ ...prev, language }));
                }}
                onBlur={() => touch("language")}
                options={LANGUAGES}
                placeholder="Select Language"
                searchPlaceholder="Search language..."
                aria-label="Select language"
              />
            </FormField>
            <FormField label="Survey Title" required error={showError("questionTitle")}>
              <input
                className={inputClass}
                placeholder="Enter Survey Title"
                value={form.questionTitle}
                disabled={readOnly}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, questionTitle: event.target.value }))
                }
                onBlur={() => touch("questionTitle")}
              />
            </FormField>
          </div>

          <div className="admin-form-grid-2">
            <FormField label="Question Text">
              <div className={`${QUESTIONS_LIST_BORDER} px-3 py-2`}>
                {!form.language ? (
                  <p className="admin-text-muted py-2 text-sm">Select a language first.</p>
                ) : isLoadingLanguageQuestions ? (
                  <div className="flex items-center gap-2 py-2 text-sm">
                    <Loader2 size={16} className="animate-spin text-[#10a950]" />
                    <span className="admin-text-muted">Loading questions...</span>
                  </div>
                ) : availableLanguageQuestions.length === 0 ? (
                  <p className="admin-text-muted py-2 text-sm">
                    No questions available for this language.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {availableLanguageQuestions.map((option) => (
                      <li
                        key={option.value}
                        className="flex items-center justify-between gap-2 rounded-lg px-1 py-0.5"
                      >
                        <span className="admin-text min-w-0 flex-1 truncate px-2 py-2 text-sm">
                          {option.label}
                        </span>
                        {!readOnly ? (
                          <button
                            type="button"
                            onClick={() => handleAddAvailableQuestion(option)}
                            disabled={
                              isSubmitting ||
                              addingQuestionId === String(option.value)
                            }
                            className="admin-icon-action shrink-0"
                            aria-label={`Add ${option.label}`}
                            title="Add"
                          >
                            {addingQuestionId === String(option.value) ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Plus size={16} strokeWidth={2} />
                            )}
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </FormField>

            <div className="space-y-5">
              <FormField label="Questions">
                <div className={`${QUESTIONS_LIST_BORDER} px-3 py-2`}>
                  {form.questions.length === 0 ? (
                    <p className="admin-text-muted py-2 text-sm">No questions added yet.</p>
                  ) : (
                    <ul className="space-y-1">
                      {form.questions.map((question, index) => {
                        const isActive = index === activeQuestionIndex;
                        const label = question.questionText?.trim() || "Untitled";

                        return (
                          <li
                            key={question.id}
                            className="flex items-center justify-between gap-2 rounded-lg px-1 py-0.5"
                          >
                            <button
                              type="button"
                              onClick={() => setActiveQuestionIndex(index)}
                              className={`min-w-0 flex-1 truncate rounded-lg px-2 py-2 text-left text-sm transition ${
                                isActive
                                  ? "admin-text font-semibold"
                                  : "admin-text-muted hover:admin-text"
                              }`}
                            >
                              {label}
                            </button>
                            {!readOnly ? (
                              <button
                                type="button"
                                onClick={() => removeQuestionAtIndex(index)}
                                disabled={isSubmitting}
                                className="admin-icon-action admin-icon-action--danger shrink-0"
                                aria-label={`Delete ${label}`}
                                title="Delete"
                              >
                                <Trash2 size={16} strokeWidth={2} />
                              </button>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </FormField>

              {!readOnly && form.questions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveQuestion(-1)}
                    disabled={isSubmitting || activeQuestionIndex === 0}
                    className={getAdminCancelButtonClass("modal")}
                  >
                    Move Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(1)}
                    disabled={
                      isSubmitting || activeQuestionIndex >= form.questions.length - 1
                    }
                    className={getAdminCancelButtonClass("modal")}
                  >
                    Move Down
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {showError("questions") && (
            <p className="text-xs text-[var(--admin-danger-text)]">{showError("questions")}</p>
          )}

          <div className="admin-form-actions flex flex-wrap items-center gap-3 pt-5">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(16,169,80,0.28)] transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? "Update" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => navigate(LIST_PATH)}
              className={getAdminCancelButtonClass()}
            >
              Cancel
            </button>
            {!readOnly ? (
              <button
                type="button"
                onClick={handleClearForm}
                disabled={isSubmitting}
                className={getAdminCancelButtonClass()}
              >
                Clear Form
              </button>
            ) : null}
          </div>
        </form>
      </TableCard>
    </div>
  );
}

export default PanelSurveyFormPage;
