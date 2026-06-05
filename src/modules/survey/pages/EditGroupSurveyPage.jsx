import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import TableCard from "../../../components/admin/TableCard";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { getRequiredError, isFormValid } from "../../shared/utils/validation";

const GROUP_SURVEY_EDIT_FIELDS = ["client", "projectName"];
import {
  GROUP_SURVEY_CLIENT_OPTIONS,
  getDemoGroupSurveyRow,
  getDemoGroupSurveySimpleEditForm,
} from "../data/groupSurveyData";
import { updateGroupSurveyProject } from "../services/groupSurveyApi";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

function EditGroupSurveyPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const group = useMemo(() => getDemoGroupSurveyRow(id), [id]);
  const { readOnly, showSubmit } = useFormAccess();

  const initialForm = useMemo(() => getDemoGroupSurveySimpleEditForm(id), [id]);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputClass = getAdminInputClass();
  const selectClass = `${inputClass} appearance-none`;

  const errors = useMemo(
    () => ({
      client: getRequiredError(form.client, "Client"),
      projectName: getRequiredError(form.projectName, "Project Name"),
    }),
    [form]
  );

  const { showError, touch, validateSubmit, resetValidation } = useFormValidation({
    errors,
    fields: GROUP_SURVEY_EDIT_FIELDS,
  });

  useEffect(() => {
    setForm(initialForm);
    resetValidation();
  }, [initialForm, resetValidation]);

  const canSubmit =
    showSubmit && !readOnly && isFormValid(errors) && !isSubmitting;

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || !isFormValid(errors)) return;

    setIsSubmitting(true);
    try {
      const data = await updateGroupSurveyProject(id, form);
      toastApiSuccess(data);
      navigate("/survey/group", { replace: true });
    } catch (err) {
      toastApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Edit Project"
        subtitle={group.groupProject}
        breadcrumbs={[
          { label: "Group Survey", to: "/survey/group" },
          { label: "Edit Project" },
        ]}
        isDarkMode={isDarkMode}
      />

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <TableCard title="Project Details" isDarkMode={isDarkMode}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Client" required error={showError("client")}>
              <select
                className={selectClass}
                value={form.client}
                onChange={(e) => setField("client", e.target.value)}
                onBlur={() => touch("client")}
                disabled={fieldDisabled(readOnly, isSubmitting)}
              >
                <option value="">Select Client</option>
                {GROUP_SURVEY_CLIENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Project Name"
              required
              error={showError("projectName")}
            >
              <input
                className={inputClass}
                placeholder="Enter Project Name"
                value={form.projectName}
                onChange={(e) => setField("projectName", e.target.value)}
                onBlur={() => touch("projectName")}
                disabled={fieldDisabled(readOnly, isSubmitting)}
              />
            </FormField>
          </div>

          <div className="mt-4 space-y-4">
            <FormField label="Project Description">
              <textarea
                className={`${inputClass} min-h-[120px] resize-y py-3`}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                disabled={fieldDisabled(readOnly, isSubmitting)}
              />
            </FormField>
            <FormField label="Notes">
              <textarea
                className={`${inputClass} min-h-[120px] resize-y py-3`}
                placeholder="Enter Project Notes"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                disabled={fieldDisabled(readOnly, isSubmitting)}
              />
            </FormField>
          </div>
        </TableCard>

        <div className="admin-form-actions flex flex-wrap items-center gap-3">
          {showSubmit && !readOnly && (
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? "Updating..." : "Update"}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate("/survey/group")}
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

export default EditGroupSurveyPage;
