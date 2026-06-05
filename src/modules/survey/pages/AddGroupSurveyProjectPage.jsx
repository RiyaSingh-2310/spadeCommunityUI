import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass } from "../../shared/utils/formStyles";
import SurveyForm from "../components/SurveyForm";
import {
  ADD_PROJECT_DEFAULTS,
  GROUP_PROJECT_MANAGER_OPTIONS,
  GROUP_SALES_MANAGER_OPTIONS,
  GROUP_SURVEY_CLIENT_OPTIONS,
  getDemoGroupSurveyRow,
} from "../data/groupSurveyData";
import { createEmptySurveyForm } from "../data/surveyFormData";
import { createGroupSurveyProject } from "../services/groupSurveyApi";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  getSurveyFormErrors,
  isSurveyFormSubmittable,
  SURVEY_FORM_FIELDS,
} from "../utils/surveyFormValidation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

function AddGroupSurveyProjectPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const group = useMemo(() => getDemoGroupSurveyRow(groupId), [groupId]);
  const { readOnly, showSubmit } = useFormAccess();

  const [form, setForm] = useState(() => ({
    ...createEmptySurveyForm(),
    client: group.client,
    description: ADD_PROJECT_DEFAULTS.description,
    notes: ADD_PROJECT_DEFAULTS.notes,
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = useMemo(() => getSurveyFormErrors(form), [form]);
  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: SURVEY_FORM_FIELDS,
  });
  const canSubmit =
    showSubmit && !readOnly && isSurveyFormSubmittable(form) && !isSubmitting;

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || !isSurveyFormSubmittable(form)) return;

    setIsSubmitting(true);
    try {
      const data = await createGroupSurveyProject(groupId, {
        ...form,
        groupProject: group.groupProject,
      });
      toastApiSuccess(data);
      navigate(`/survey/group/${encodeURIComponent(groupId)}/projects`, {
        replace: true,
      });
    } catch (err) {
      toastApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Add Survey Project"
        subtitle={group.groupProject}
        breadcrumbs={[
          { label: "Group Survey", to: "/survey/group" },
          {
            label: "View Projects",
            to: `/survey/group/${encodeURIComponent(groupId)}/projects`,
          },
          { label: "Add Survey Project" },
        ]}
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
          groupProject={group.groupProject}
          clientOptions={GROUP_SURVEY_CLIENT_OPTIONS}
          projectManagerOptions={GROUP_PROJECT_MANAGER_OPTIONS}
          salesManagerOptions={GROUP_SALES_MANAGER_OPTIONS}
        />

        <div className="admin-form-actions flex flex-wrap items-center gap-3">
          {showSubmit && !readOnly && (
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              navigate(`/survey/group`)
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

export default AddGroupSurveyProjectPage;
