import SearchableSelect from "../../../components/admin/SearchableSelect";
import FormField from "../../../components/admin/FormField";
import RichTextEditor from "../../../components/admin/RichTextEditor";
import TableCard from "../../../components/admin/TableCard";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { NAME_FIELD_MAX_LENGTH, limitTextInput } from "../../shared/utils/validation";
import { PROJECT_STATUS_OPTIONS } from "../data/surveyFormData";

function SurveyForm({
  form,
  setForm,
  errors,
  showError,
  touch,
  isDarkMode,
  disabled = false,
  groupProject = "",
  readOnlyClient = false,
  lockedClientLabel = "",
  readOnlyProjectName = false,
  clientOptions = [],
  isLoadingClients = false,
  projectManagerOptions = [],
  salesManagerOptions = [],
  salesProjectOptions = [],
  /** @deprecated Use salesProjectOptions */
  rfqOptions = [],
}) {
  const inputClass = getAdminInputClass();
  const selectClass = `${inputClass} appearance-none`;
  const resolvedSalesProjectOptions = salesProjectOptions.length
    ? salesProjectOptions
    : rfqOptions;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-5">
      <TableCard
        title="Project Information"
        isDarkMode={isDarkMode}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {groupProject ? (
            <FormField label="Group Project">
              <input
                className={`${inputClass} opacity-70`}
                value={groupProject}
                disabled
                readOnly
              />
            </FormField>
          ) : null}

          <FormField label="Client" required error={showError("client")}>
            {lockedClientLabel ? (
              <input
                className={`${inputClass} opacity-70`}
                value={lockedClientLabel}
                disabled
                readOnly
              />
            ) : (
              <SearchableSelect
                inputClass={`${selectClass} ${readOnlyClient ? "opacity-70" : ""}`}
                value={form.client}
                onChange={(next) => setField("client", next)}
                onBlur={() => touch("client")}
                options={clientOptions}
                placeholder="Select Client"
                disabled={disabled || readOnlyClient || isLoadingClients}
                loading={isLoadingClients}
                loadingLabel="Loading clients..."
                emptyMessage="No clients available"
                searchPlaceholder="Search client..."
                aria-label="Select client"
              />
            )}
          </FormField>

          <FormField label="Project Name" required error={showError("projectName")}>
            <input
              className={`${inputClass} ${readOnlyProjectName ? "opacity-70" : ""}`}
              placeholder="Enter Project Name"
              value={form.projectName}
              maxLength={NAME_FIELD_MAX_LENGTH}
              onChange={(e) =>
                setField("projectName", limitTextInput(e.target.value, NAME_FIELD_MAX_LENGTH))
              }
              onBlur={() => touch("projectName")}
              disabled={disabled || readOnlyProjectName}
              readOnly={readOnlyProjectName}
            />
          </FormField>

          <FormField label="Project Code" required error={showError("projectCode")}>
            <input
              className={inputClass}
              placeholder="Enter Project Code"
              value={form.projectCode}
              onChange={(e) => setField("projectCode", e.target.value)}
              onBlur={() => touch("projectCode")}
              disabled={disabled}
            />
          </FormField>

          <FormField label="Project Manager" required error={showError("projectManager")}>
            <SearchableSelect
              inputClass={selectClass}
              value={form.projectManager}
              onChange={(next) => setField("projectManager", next)}
              onBlur={() => touch("projectManager")}
              options={projectManagerOptions}
              placeholder="Select Project Manager"
              disabled={disabled}
              searchPlaceholder="Search project manager..."
              aria-label="Select project manager"
            />
          </FormField>

          <FormField label="Sales Manager" error={showError("salesManager")}>
            <SearchableSelect
              inputClass={selectClass}
              value={form.salesManager}
              onChange={(next) => setField("salesManager", next)}
              options={salesManagerOptions}
              placeholder="Select Sales Manager"
              disabled={disabled}
              searchPlaceholder="Search sales manager..."
              aria-label="Select sales manager"
            />
          </FormField>

          <FormField label="Sales Project (RFQ)" error={showError("salesProject")}>
            <SearchableSelect
              inputClass={selectClass}
              value={form.salesProject}
              onChange={(next) => setField("salesProject", next)}
              options={resolvedSalesProjectOptions}
              placeholder="Select Sales Project (RFQ)"
              disabled={disabled}
              searchPlaceholder="Search RFQ ID..."
              aria-label="Select Sales Project (RFQ)"
            />
          </FormField>

          <FormField label="Status" required error={showError("status") ? errors.status : ""}>
            <SearchableSelect
              inputClass={selectClass}
              value={form.status || "Active"}
              onChange={(next) => setField("status", next || "Active")}
              onBlur={() => touch("status")}
              options={PROJECT_STATUS_OPTIONS}
              placeholder="Select Status"
              disabled={disabled}
              searchable={false}
              aria-label="Select status"
            />
          </FormField>
        </div>

        <div className="mt-4 space-y-4">
          <FormField label="Description">
            <RichTextEditor
              isDarkMode={isDarkMode}
              value={form.description}
              onChange={(value) => setField("description", value)}
              placeholder="Enter Description"
              disabled={disabled}
            />
          </FormField>
          <FormField label="Notes">
            <textarea
              className={`${inputClass} min-h-[120px] resize-y py-3`}
              placeholder="Enter Project Notes"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              disabled={disabled}
            />
          </FormField>
        </div>
      </TableCard>
    </div>
  );
}

export default SurveyForm;
