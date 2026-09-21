import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import FormField from "../../../components/admin/FormField";
import AdminPasswordInput from "../../../components/admin/AdminPasswordInput";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import {
  getAdminCancelButtonClass,
  getAdminInputClass,
  getAdminTextareaClass,
} from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  getRequiredError,
  isFormValidForFields,
} from "../../shared/utils/validation";
import {
  API_AUTH_TYPE_OPTIONS,
  API_HTTP_METHODS,
  API_MANAGEMENT_FORM_FIELDS,
  API_STATUS_OPTIONS,
  EMPTY_API_MANAGEMENT_FORM,
  mapRecordToForm,
} from "../constants/apiManagement";

function ApiManagementFormModal({
  isOpen,
  mode = "add",
  record = null,
  isDarkMode,
  isSubmitting = false,
  onClose,
  onSubmit,
}) {
  const isEdit = mode === "edit";
  const inputClass = getAdminInputClass();
  const textareaClass = getAdminTextareaClass();
  const [form, setForm] = useState(EMPTY_API_MANAGEMENT_FORM);

  useEffect(() => {
    if (!isOpen) return;
    setForm(
      isEdit ? mapRecordToForm(record) : { ...EMPTY_API_MANAGEMENT_FORM }
    );
  }, [isOpen, isEdit, record]);

  const hasExistingKey = Boolean(
    form.hasExistingKey ||
      String(record?.apiKey ?? record?.api_key ?? "").trim()
  );

  const errors = useMemo(() => {
    const next = {
      apiName: getRequiredError(form.apiName, "API Name"),
      apiLabel: getRequiredError(form.apiLabel, "API Label"),
      apiUserId: getRequiredError(form.apiUserId, "API User ID"),
      apiKey: "",
      baseUrl: getRequiredError(form.baseUrl, "Base URL"),
      endpoint: getRequiredError(form.endpoint, "Endpoint"),
      method: getRequiredError(form.method, "Method"),
      authType: getRequiredError(form.authType, "Auth Type"),
      headerName: "",
      description: "",
      status: getRequiredError(form.status, "Status"),
    };

    // Required on create; optional on edit when a key already exists.
    if (!isEdit || !hasExistingKey) {
      next.apiKey = getRequiredError(form.apiKey, "API Key");
    }

    return next;
  }, [form, isEdit, hasExistingKey]);

  const { showError, touch, validateSubmit, resetValidation } = useFormValidation({
    errors,
    fields: API_MANAGEMENT_FORM_FIELDS,
  });

  useEffect(() => {
    if (!isOpen) {
      resetValidation();
    }
  }, [isOpen, resetValidation]);

  if (!isOpen) return null;

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit =
    !isSubmitting && isFormValidForFields(errors, API_MANAGEMENT_FORM_FIELDS);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isSubmitting || !validateSubmit() || !canSubmit) return;

    const payload = {
      ...form,
      apiName: String(form.apiName).trim(),
      apiLabel: String(form.apiLabel).trim(),
      apiUserId: String(form.apiUserId).trim(),
      apiKey: String(form.apiKey).trim(),
      baseUrl: String(form.baseUrl).trim(),
      endpoint: String(form.endpoint).trim(),
      method: String(form.method).trim().toUpperCase(),
      authType: String(form.authType).trim(),
      headerName: String(form.headerName).trim(),
      description: String(form.description).trim(),
      status: String(form.status).trim(),
    };

    onSubmit?.(payload, { mode });
  };

  const title = isEdit ? "Edit API" : "Add API";
  const submitLabel = isEdit ? "Update" : "Save";

  return (
    <div className="admin-modal-overlay fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className="admin-header-overlay absolute inset-0 cursor-pointer"
        aria-label="Close API form"
        onClick={onClose}
        disabled={isSubmitting}
      />
      <div
        className="admin-header-surface admin-modal-panel relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-management-form-title"
      >
        <div className="border-b border-[var(--admin-table-border)] px-5 py-4">
          <h2
            id="api-management-form-title"
            className="admin-text text-lg font-semibold"
          >
            {title}
          </h2>
          <p className="admin-text-muted mt-1 text-xs">
            Configure external API credentials and request settings.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
          noValidate
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
            <section className="space-y-4">
              <h3 className="admin-text text-sm font-semibold">Basic Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="API Name"
                  required
                  error={showError("apiName")}
                >
                  <input
                    className={inputClass}
                    value={form.apiName}
                    onChange={(e) => setField("apiName", e.target.value)}
                    onBlur={() => touch("apiName")}
                    placeholder="Tremendous"
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                </FormField>
                <FormField
                  label="API Label"
                  required
                  error={showError("apiLabel")}
                >
                  <input
                    className={inputClass}
                    value={form.apiLabel}
                    onChange={(e) => setField("apiLabel", e.target.value)}
                    onBlur={() => touch("apiLabel")}
                    placeholder="Tremendous Reward API"
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                </FormField>
                <FormField
                  label="API User ID"
                  required
                  error={showError("apiUserId")}
                >
                  <input
                    className={inputClass}
                    value={form.apiUserId}
                    onChange={(e) => setField("apiUserId", e.target.value)}
                    onBlur={() => touch("apiUserId")}
                    placeholder="Enter API User ID"
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                </FormField>
                <FormField
                  label="API Key"
                  required={!isEdit || !hasExistingKey}
                  error={showError("apiKey")}
                  hint={
                    isEdit && hasExistingKey
                      ? "Leave blank to keep the existing key."
                      : undefined
                  }
                >
                  <AdminPasswordInput
                    value={form.apiKey}
                    onChange={(e) => setField("apiKey", e.target.value)}
                    onBlur={() => touch("apiKey")}
                    placeholder={
                      isEdit && hasExistingKey
                        ? "••••••••••••"
                        : "Enter API Key"
                    }
                    autoComplete="new-password"
                    aria-label="API Key"
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>
            </section>

            <section className="space-y-4 border-t border-[var(--admin-table-border)] pt-5">
              <h3 className="admin-text text-sm font-semibold">API Configuration</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  className="sm:col-span-2"
                  label="Base URL"
                  required
                  error={showError("baseUrl")}
                >
                  <input
                    className={inputClass}
                    value={form.baseUrl}
                    onChange={(e) => setField("baseUrl", e.target.value)}
                    onBlur={() => touch("baseUrl")}
                    placeholder="https://api.example.com"
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                </FormField>
                <FormField
                  label="Endpoint"
                  required
                  error={showError("endpoint")}
                >
                  <input
                    className={inputClass}
                    value={form.endpoint}
                    onChange={(e) => setField("endpoint", e.target.value)}
                    onBlur={() => touch("endpoint")}
                    placeholder="/v2/orders"
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                </FormField>
                <FormField label="Method" required error={showError("method")}>
                  <SearchableSelect
                    value={form.method}
                    onChange={(value) => {
                      setField("method", value);
                      touch("method");
                    }}
                    options={API_HTTP_METHODS}
                    isDarkMode={isDarkMode}
                    placeholder="Select method"
                    disabled={isSubmitting}
                  />
                </FormField>
                <FormField
                  label="Auth Type"
                  required
                  error={showError("authType")}
                >
                  <SearchableSelect
                    value={form.authType}
                    onChange={(value) => {
                      setField("authType", value);
                      touch("authType");
                    }}
                    options={API_AUTH_TYPE_OPTIONS}
                    isDarkMode={isDarkMode}
                    placeholder="Select auth type"
                    disabled={isSubmitting}
                  />
                </FormField>
                <FormField label="Header Name" error={showError("headerName")}>
                  <input
                    className={inputClass}
                    value={form.headerName}
                    onChange={(e) => setField("headerName", e.target.value)}
                    onBlur={() => touch("headerName")}
                    placeholder="Authorization"
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>
            </section>

            <section className="space-y-4 border-t border-[var(--admin-table-border)] pt-5">
              <h3 className="admin-text text-sm font-semibold">
                Additional Information
              </h3>
              <FormField label="Description" error={showError("description")}>
                <textarea
                  className={textareaClass}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  onBlur={() => touch("description")}
                  placeholder="Optional notes about this integration"
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField label="Status" required error={showError("status")}>
                <SearchableSelect
                  value={form.status}
                  onChange={(value) => {
                    setField("status", value);
                    touch("status");
                  }}
                  options={API_STATUS_OPTIONS}
                  isDarkMode={isDarkMode}
                  placeholder="Select status"
                  disabled={isSubmitting}
                />
              </FormField>
            </section>
          </div>

          <div className="admin-modal-actions flex flex-wrap items-center justify-end gap-2 border-t border-[var(--admin-table-border)] px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={getAdminCancelButtonClass("modal")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="admin-btn-primary inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting
                ? isEdit
                  ? "Updating..."
                  : "Saving..."
                : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApiManagementFormModal;
