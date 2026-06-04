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
import { createSurvey, updateSurvey } from "../services/surveyApi";
import {
  getSurveyFormErrors,
  isSurveyFormSubmittable,
} from "../utils/surveyFormValidation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

function SurveyFormPage({ isDarkMode, mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";
  const { readOnly, showSubmit } = useFormAccess();

  const initialForm = useMemo(
    () => (isEdit && id ? getDemoSurveyFormForEdit(id) : createEmptySurveyForm()),
    [isEdit, id]
  );

  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setForm(initialForm);
    setTouched(false);
  }, [initialForm]);

  const errors = useMemo(() => getSurveyFormErrors(form), [form]);
  const canSubmit =
    showSubmit && !readOnly && isSurveyFormSubmittable(form) && !isSubmitting;

  const onSubmit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isSurveyFormSubmittable(form)) return;

    setIsSubmitting(true);
    try {
      const data = isEdit
        ? await updateSurvey(id, form)
        : await createSurvey(form);
      toastApiSuccess(data);
      navigate("/survey", { replace: true });
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
          touched={touched}
          setTouched={setTouched}
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
            onClick={() => navigate("/survey")}
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
