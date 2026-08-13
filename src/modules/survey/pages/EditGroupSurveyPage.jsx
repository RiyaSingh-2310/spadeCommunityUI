import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
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
import { getRecords as getClients } from "../../../services/clients/clientsApi";
import {
  mapClientsToSelectOptions,
  ensureSelectOption,
  resolveSelectValue,
} from "../hooks/useSurveyFormSelectOptions";
import { MAX_API_LIST_LIMIT } from "../../shared/utils/listQueryParams";
import {
  getRecord,
  mapGroupProjectToForm,
  updateGroupProject,
} from "../services/groupSurveyApi";

const GROUP_SURVEY_EDIT_FIELDS = ["projectName", "clientId"];

const GROUP_SURVEY_EDIT_REQUIRED_FIELDS = ["projectName", "clientId"];

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

function EditGroupSurveyPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { readOnly, showSubmit } = useFormAccess();
  const [form, setForm] = useState({
    projectName: "",
    description: "",
    notes: "",
    clientId: "",
  });
  const [clientOptions, setClientOptions] = useState([]);
  const [loadedRecord, setLoadedRecord] = useState(null);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
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
          setClientOptions(mapClientsToSelectOptions(records, { activeOnly: false }));
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

  useEffect(() => {
    if (!id || isLoadingClients) return undefined;

    let cancelled = false;

    const loadGroupProject = async () => {
      setIsLoadingRecord(true);
      setLoadFailed(false);

      try {
        const project = await getRecord(id);
        if (cancelled) return;

        const mapped = mapGroupProjectToForm(project);
        const clientLabel =
          project?.clients?.find(
            (client) => String(client?.id) === String(mapped.clientId)
          )?.name ??
          project?.client_names ??
          "";
        const resolvedClientId = resolveSelectValue(
          clientOptions,
          mapped.clientId,
          clientLabel
        );
        setLoadedRecord(project);
        setForm({
          projectName: mapped.projectName,
          description: mapped.description,
          notes: mapped.notes,
          clientId: resolvedClientId,
        });
        setInitialSnapshot({
          projectName: mapped.projectName.trim(),
          description: mapped.description ?? "",
          notes: mapped.notes ?? "",
          clientId: String(resolvedClientId ?? ""),
        });
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoadingRecord(false);
      }
    };

    loadGroupProject();
    return () => {
      cancelled = true;
    };
  }, [id, isLoadingClients]);

  useEffect(() => {
    if (isLoadingRecord || isLoadingClients || !initialSnapshot || !loadedRecord) return;

    const savedClient = loadedRecord?.clients?.find(
      (client) => String(client?.id) === String(form.clientId)
    );
    const clientLabel = savedClient?.name ?? loadedRecord?.client_names ?? "";
    const nextClientId = resolveSelectValue(
      clientOptions,
      form.clientId || loadedRecord?.client_id,
      clientLabel
    );

    if (!nextClientId || nextClientId === form.clientId) return;

    setForm((prev) => ({ ...prev, clientId: nextClientId }));
    setInitialSnapshot((prev) =>
      prev ? { ...prev, clientId: nextClientId } : prev
    );
  }, [
    isLoadingRecord,
    isLoadingClients,
    initialSnapshot,
    loadedRecord,
    clientOptions,
    form.clientId,
  ]);

  const mergedClientOptions = useMemo(() => {
    const savedClient = loadedRecord?.clients?.find(
      (client) => String(client?.id) === String(form.clientId)
    );

    return ensureSelectOption(
      clientOptions,
      form.clientId,
      savedClient?.name ?? loadedRecord?.client_names
    );
  }, [clientOptions, form.clientId, loadedRecord]);

  const errors = useMemo(
    () => ({
      projectName: getRequiredMaxLengthError(form.projectName, "Project Name"),
      clientId: getRequiredError(form.clientId, "Client"),
    }),
    [form]
  );

  const { showError, touch, validateSubmit, resetValidation } = useFormValidation({
    errors,
    fields: GROUP_SURVEY_EDIT_FIELDS,
  });

  useEffect(() => {
    resetValidation();
  }, [id, resetValidation]);

  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;

    if (form.projectName.trim() !== initialSnapshot.projectName) return true;
    if (String(form.description ?? "") !== String(initialSnapshot.description ?? "")) return true;
    if (String(form.notes ?? "") !== String(initialSnapshot.notes ?? "")) return true;
    if (String(form.clientId ?? "") !== String(initialSnapshot.clientId ?? "")) return true;

    return false;
  }, [form, initialSnapshot]);

  const canSubmit =
    showSubmit &&
    !readOnly &&
    isFormValidForFields(errors, GROUP_SURVEY_EDIT_REQUIRED_FIELDS) &&
    !isSubmitting &&
    !isLoadingRecord &&
    !isLoadingClients &&
    !loadFailed &&
    isDirty;

  const onSubmit = async (event) => {
    event.preventDefault();
    if (
      !validateSubmit() ||
      !isFormValidForFields(errors, GROUP_SURVEY_EDIT_REQUIRED_FIELDS) ||
      !isDirty
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await updateGroupProject(id, form);
      toastApiSuccess(data, "Group survey updated successfully.");
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

  if (isLoadingRecord || isLoadingClients) {
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
          title="Edit Group Survey"
          breadcrumbs={[
            { label: "Group Survey", to: "/survey/group" },
            { label: "Edit Group Survey" },
          ]}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text rounded-xl border border-[var(--admin-border)] p-6 text-sm">
          Unable to load group survey details.
          <button
            type="button"
            onClick={() => navigate("/survey/group")}
            className="ml-2 font-semibold text-[#10a950] hover:underline"
          >
            Back to Group Survey
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Edit Group Survey"
        subtitle={form.projectName}
        breadcrumbs={[
          { label: "Group Survey", to: "/survey/group" },
          { label: "Edit Group Survey" },
        ]}
        isDarkMode={isDarkMode}
      />

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <TableCard title="Project Details" isDarkMode={isDarkMode}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Clients" required error={showError("clientId")}>
              <SearchableSelect
                inputClass={selectClass}
                value={form.clientId}
                onChange={(clientId) => setField("clientId", clientId)}
                onBlur={() => touch("clientId")}
                options={mergedClientOptions}
                placeholder="Select Client"
                disabled={fieldDisabled(readOnly, isSubmitting)}
                loading={isLoadingClients}
                loadingLabel="Loading clients..."
                emptyMessage="No clients available"
                searchPlaceholder="Search client..."
                aria-label="Select client"
              />
            </FormField>

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
          </div>

          <div className="mt-4 space-y-4">
            <FormField label="Project Description">
              <RichTextEditor
                isDarkMode={isDarkMode}
                value={form.description}
                onChange={(value) => setField("description", value)}
                placeholder="Enter project description"
                disabled={fieldDisabled(readOnly, isSubmitting)}
                height={200}
                contentKey={`group-survey-${id}`}
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
