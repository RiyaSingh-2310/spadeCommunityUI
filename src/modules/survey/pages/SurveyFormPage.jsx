import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass } from "../../shared/utils/formStyles";
import SurveyForm from "../components/SurveyForm";
import {
  createEmptySurveyForm,
  getDemoSurveyFormForEdit,
} from "../data/surveyFormData";
import {
  createSurvey,
  getRecord,
  mapSurveyToForm,
  updateSurvey,
} from "../services/surveyApi";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  areSurveyFormsEqual,
  getSurveyFormErrors,
  isSurveyFormSubmittable,
  SURVEY_FORM_FIELDS,
} from "../utils/surveyFormValidation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

function SurveyFormPage({ isDarkMode, mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";
  const { readOnly, showSubmit } = useFormAccess();

  const [form, setForm] = useState(createEmptySurveyForm);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);

  const errors = useMemo(() => getSurveyFormErrors(form), [form]);
  const { showError, touch, validateSubmit, resetValidation } = useFormValidation({
    errors,
    fields: SURVEY_FORM_FIELDS,
  });

  useEffect(() => {
    if (!isEdit || !id) return undefined;

    let cancelled = false;

    const loadSurvey = async () => {
      resetValidation();
      setInitialSnapshot(null);
      setIsLoadingRecord(true);
      setLoadFailed(false);

      try {
        const record = await getRecord(id);
        if (cancelled) return;
        const fallback = getDemoSurveyFormForEdit(id);
        const mapped = mapSurveyToForm(record, fallback);
        setForm(mapped);
        setInitialSnapshot(mapped);
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
        const fallback = getDemoSurveyFormForEdit(id);
        setForm(fallback);
        setInitialSnapshot(fallback);
      } finally {
        if (!cancelled) setIsLoadingRecord(false);
      }
    };

    loadSurvey();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, resetValidation]);

  const isDirty = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false;
    return !areSurveyFormsEqual(form, initialSnapshot);
  }, [isEdit, initialSnapshot, form]);

  const canSubmit =
    showSubmit &&
    !readOnly &&
    isSurveyFormSubmittable(form) &&
    !isSubmitting &&
    !isLoadingRecord &&
    !loadFailed &&
    (!isEdit || isDirty);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (
      !validateSubmit() ||
      !isSurveyFormSubmittable(form) ||
      (isEdit && !isDirty)
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = isEdit
        ? await updateSurvey(id, form)
        : await createSurvey(form);
      toastApiSuccess(data);
      navigate("/survey", { replace: true, state: { refresh: true } });
    } catch (err) {
      toastApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = isEdit ? "Edit Survey" : "Create Survey";
  const breadcrumbs = isEdit
    ? [
        { label: "Survey", to: "/survey" },
        { label: "Project Details", to: `/survey/view/${encodeURIComponent(id)}` },
        { label: "Edit Survey" },
      ]
    : [{ label: "Survey", to: "/survey" }, { label: "Create Survey" }];

  if (isEdit && isLoadingRecord) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title={title}
          subtitle={`Survey ${id}`}
          breadcrumbs={breadcrumbs}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text flex items-center gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading survey...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={title}
        subtitle={isEdit ? `Survey ${id}` : "Add a new survey project"}
        breadcrumbs={breadcrumbs}
        isDarkMode={isDarkMode}
      />

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <SurveyForm
          form={form}
          setForm={setForm}
          errors={errors}
          showError={showError}
          touch={touch}
          isDarkMode={isDarkMode}
          disabled={fieldDisabled(readOnly, isSubmitting)}
        />

        <div className="admin-form-actions flex flex-wrap items-center gap-3">
          {showSubmit && !readOnly && (
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting
                ? isEdit
                  ? "Updating..."
                  : "Submitting..."
                : isEdit
                  ? "Update"
                  : "Submit"}
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              isEdit
                ? navigate(`/survey/view/${encodeURIComponent(id)}`)
                : navigate("/survey")
            }
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

export default SurveyFormPage;
