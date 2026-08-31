import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import RichTextEditor from "../../../components/admin/RichTextEditor";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import TableCard from "../../../components/admin/TableCard";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { getRequiredError, getRequiredMaxLengthError, isFormValidForFields, limitTextInput, NAME_FIELD_MAX_LENGTH } from "../../shared/utils/validation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { mapClientsToSelectOptions } from "../hooks/useSurveyFormSelectOptions";
import { getRecords as getClients } from "../../../services/clients/clientsApi";
import { MAX_API_LIST_LIMIT } from "../../shared/utils/listQueryParams";
import {
  createGroupProject,
  createEmptyGroupProjectForm,
} from "../services/groupSurveyApi";

const GROUP_SURVEY_FORM_FIELDS = ["projectName", "clientId"];

const GROUP_SURVEY_REQUIRED_FIELDS = ["projectName", "clientId"];

async function fetchAllClients() {
  const limit = MAX_API_LIST_LIMIT;
  const items = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await getClients({ page, limit });
    items.push(...(response?.items ?? []));
    totalPages = Math.max(1, Number(response?.totalPages) || 1);
    page += 1;
  } while (page <= totalPages && page <= 50);

  return items;
}

function AddGroupSurveyPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { readOnly, showSubmit } = useFormAccess();
  const [form, setForm] = useState(createEmptyGroupProjectForm);
  const [clientOptions, setClientOptions] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputClass = getAdminInputClass();
  const selectClass = `${inputClass} appearance-none`;

  useEffect(() => {
    let cancelled = false;

    const loadClients = async () => {
      setIsLoadingClients(true);
      try {
        const records = await fetchAllClients();
        if (!cancelled) {
          setClientOptions(mapClientsToSelectOptions(records, { activeOnly: true }));
        }
      } catch {
        if (!cancelled) setClientOptions([]);
      } finally {
        if (!cancelled) setIsLoadingClients(false);
      }
    };

    loadClients();
    return () => {
      cancelled = true;
    };
  }, []);

  const errors = useMemo(
    () => ({
      projectName: getRequiredMaxLengthError(form.projectName, "Project Name"),
      clientId: getRequiredError(form.clientId, "Client"),
    }),
    [form]
  );

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: GROUP_SURVEY_FORM_FIELDS,
  });

  const canSubmit =
    showSubmit &&
    !readOnly &&
    isFormValidForFields(errors, GROUP_SURVEY_REQUIRED_FIELDS) &&
    !isSubmitting &&
    !isLoadingClients;

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || !isFormValidForFields(errors, GROUP_SURVEY_REQUIRED_FIELDS)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await createGroupProject(form);
      toastApiSuccess(data, "Group survey added successfully.");
      navigate("/survey/group", {
        replace: true,
        state: { refresh: true },
      });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Add Group Survey"
        breadcrumbs={[
          { label: "Group Survey", to: "/survey/group" },
          { label: "Add Group Survey" },
        ]}
        isDarkMode={isDarkMode}
      />

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <TableCard title="Project Details" isDarkMode={isDarkMode}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Project Name" required error={showError("projectName")}>
              <input
                className={inputClass}
                placeholder="Enter Project Name"
                value={form.projectName}
                maxLength={NAME_FIELD_MAX_LENGTH}
                onChange={(e) =>
                  setField("projectName", limitTextInput(e.target.value, NAME_FIELD_MAX_LENGTH))
                }
                onBlur={() => touch("projectName")}
                disabled={fieldDisabled(readOnly, isSubmitting)}
              />
            </FormField>

            <FormField label="Clients" required error={showError("clientId")}>
              <SearchableSelect
                inputClass={selectClass}
                value={form.clientId}
                onChange={(clientId) => setField("clientId", clientId)}
                onBlur={() => touch("clientId")}
                options={clientOptions}
                placeholder="Select Client"
                disabled={fieldDisabled(readOnly, isSubmitting)}
                loading={isLoadingClients}
                loadingLabel="Loading clients..."
                emptyMessage="No clients available"
                searchPlaceholder="Search client..."
                aria-label="Select client"
              />
            </FormField>
          </div>

          <div className="mt-4 space-y-4">
            <FormField label="Project Description">
              <RichTextEditor
                isDarkMode={isDarkMode}
                value={form.description}
                onChange={(value) => setField("description", value)}
                placeholder="Enter project description"
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
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate("/survey/group", { replace: true })}
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

export default AddGroupSurveyPage;
