import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import DecimalInput from "../../../components/admin/DecimalInput";
import FormField from "../../../components/admin/FormField";
import FormRadioGroup from "../../../components/admin/FormRadioGroup";
import NumericInput from "../../../components/admin/NumericInput";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import TableCard from "../../../components/admin/TableCard";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { isFormValid, limitTextInput, NAME_FIELD_MAX_LENGTH } from "../../shared/utils/validation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { getRecords as getProjectManagers } from "../../../services/projectManagers/projectManagersApi";
import {
  CURRENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  PROJECT_LINK_TYPES,
  SURVEY_GROUP_OPTIONS,
} from "../data/surveyFormData";
import {
  mapProjectManagersToSelectOptions,
} from "../hooks/useSurveyFormSelectOptions";
import {
  createEmptyRecontactSurveyForm,
  createRecontactSurvey,
  mapSurveyToRecontactFormDefaults,
} from "../services/recontactSurveyApi";
import {
  getRecontactSurveyFormErrors,
  isRecontactSurveyFormSubmittable,
  RECONTACT_SURVEY_FORM_FIELDS,
} from "../utils/recontactSurveyValidation";

function FilterCheckbox({ label, checked, onChange, disabled }) {
  return (
    <label className="admin-text flex cursor-pointer items-center gap-2.5 text-sm font-medium">
      <input
        type="checkbox"
        className="admin-checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      {label}
    </label>
  );
}

function RecontactSurveyForm({
  isDarkMode,
  parentSurveyId,
  parentSurveyRecord,
  onCancel,
  onSuccess,
}) {
  const { readOnly, showSubmit } = useFormAccess();
  const [form, setForm] = useState(createEmptyRecontactSurveyForm);
  const [projectManagerOptions, setProjectManagerOptions] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputClass = getAdminInputClass();
  const selectClass = `${inputClass} appearance-none`;

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const data = await getProjectManagers();
        if (!cancelled) {
          setProjectManagerOptions(mapProjectManagersToSelectOptions(data.items));
        }
      } catch {
        if (!cancelled) setProjectManagerOptions([]);
      } finally {
        if (!cancelled) setIsLoadingOptions(false);
      }
    };

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const defaults = mapSurveyToRecontactFormDefaults(parentSurveyRecord);
    setForm({
      ...createEmptyRecontactSurveyForm(),
      ...defaults,
      parentSurveyId: parentSurveyId ?? defaults.parentSurveyId ?? "",
    });
  }, [parentSurveyId, parentSurveyRecord]);

  const errors = useMemo(() => getRecontactSurveyFormErrors(form), [form]);
  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: RECONTACT_SURVEY_FORM_FIELDS,
  });

  const canSubmit =
    showSubmit &&
    !readOnly &&
    isRecontactSurveyFormSubmittable(form) &&
    !isSubmitting &&
    !isLoadingOptions;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setFilter = (key, value) =>
    setForm((prev) => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      ...(key === "preScreen" && !value ? { language: "", surveyGroup: "" } : {}),
    }));

  const isSingleLink = form.projectLinkType === "Single Link";

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || !isFormValid(errors) || !isRecontactSurveyFormSubmittable(form)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await createRecontactSurvey(form);
      toastApiSuccess(data);
      onSuccess?.();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <TableCard title="Recontact Survey Details" isDarkMode={isDarkMode}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Client" required error={showError("client")}>
            <input
              className={`${inputClass} opacity-70`}
              value={form.client}
              readOnly
              disabled
              placeholder="Client"
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

          <FormField label="LOI (Minutes)" required error={showError("loi")}>
            <NumericInput
              className={inputClass}
              placeholder="Enter LOI"
              value={form.loi}
              onChange={(value) => setField("loi", value)}
              onBlur={() => touch("loi")}
              disabled={fieldDisabled(readOnly, isSubmitting)}
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
              disabled={fieldDisabled(readOnly, isSubmitting)}
              loading={isLoadingOptions}
              loadingLabel="Loading project managers..."
              searchPlaceholder="Search project manager..."
              aria-label="Select project manager"
            />
          </FormField>

          <FormField label="IR (%)" required error={showError("ir")}>
            <NumericInput
              className={inputClass}
              placeholder="Enter IR"
              value={form.ir}
              onChange={(value) => setField("ir", value)}
              onBlur={() => touch("ir")}
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <FormField label="Project Country" required error={showError("projectCountry")}>
            <input
              className={`${inputClass} opacity-70`}
              value={form.projectCountry}
              readOnly
              disabled
              placeholder="Project Country"
            />
          </FormField>

          <FormField label="Sample Size" required error={showError("sampleSize")}>
            <NumericInput
              className={inputClass}
              placeholder="Enter Sample Size"
              value={form.sampleSize}
              onChange={(value) => setField("sampleSize", value)}
              onBlur={() => touch("sampleSize")}
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <FormField label="Currency" required error={showError("currency")}>
            <SearchableSelect
              inputClass={selectClass}
              value={form.currency}
              onChange={(next) => setField("currency", next)}
              onBlur={() => touch("currency")}
              options={CURRENCY_OPTIONS}
              placeholder="Select Currency"
              disabled={fieldDisabled(readOnly, isSubmitting)}
              searchPlaceholder="Search currency..."
              aria-label="Select currency"
            />
          </FormField>

          <FormField
            label="Respondent Click Quota"
            required
            error={showError("respondentClickQuota")}
          >
            <NumericInput
              className={inputClass}
              placeholder="Enter Respondent Click Quota"
              value={form.respondentClickQuota}
              onChange={(value) => setField("respondentClickQuota", value)}
              onBlur={() => touch("respondentClickQuota")}
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <FormField label="CPI" required error={showError("cpi")}>
            <DecimalInput
              className={inputClass}
              placeholder="Enter CPI"
              value={form.cpi}
              onChange={(value) => setField("cpi", value)}
              onBlur={() => touch("cpi")}
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <FormField label="Start Date" required error={showError("startDate")}>
            <input
              type="date"
              className={inputClass}
              value={form.startDate}
              onChange={(e) => setField("startDate", e.target.value)}
              onBlur={() => touch("startDate")}
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <FormField label="End Date" required error={showError("endDate")}>
            <input
              type="date"
              className={inputClass}
              value={form.endDate}
              min={form.startDate || undefined}
              onChange={(e) => setField("endDate", e.target.value)}
              onBlur={() => touch("endDate")}
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>
        </div>

        <div className="mt-4">
          <FormField label="Project Description">
            <textarea
              className={`${inputClass} min-h-[120px] resize-y py-3`}
              placeholder="Enter Project Description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>
        </div>

        <div className="mt-4">
          <FormRadioGroup
            label="Project Link Type"
            name="recontactProjectLinkType"
            value={form.projectLinkType}
            onChange={(value) => {
              setField("projectLinkType", value);
              touch("projectLinkType");
              if (value === "Multi Link") {
                setForm((prev) => ({ ...prev, liveUrl: "", testUrl: "" }));
              }
            }}
            options={PROJECT_LINK_TYPES}
            isDarkMode={isDarkMode}
          />
        </div>

        {isSingleLink ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormField label="Live Link" required error={showError("liveUrl")}>
              <input
                className={inputClass}
                placeholder="Enter Live Link"
                value={form.liveUrl}
                onChange={(e) => setField("liveUrl", e.target.value)}
                onBlur={() => touch("liveUrl")}
                disabled={fieldDisabled(readOnly, isSubmitting)}
              />
            </FormField>
            <FormField label="Test Link" required error={showError("testUrl")}>
              <input
                className={inputClass}
                placeholder="Enter Test Link"
                value={form.testUrl}
                onChange={(e) => setField("testUrl", e.target.value)}
                onBlur={() => touch("testUrl")}
                disabled={fieldDisabled(readOnly, isSubmitting)}
              />
            </FormField>
          </div>
        ) : null}
      </TableCard>

      <TableCard title="Project Filter" isDarkMode={isDarkMode}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterCheckbox
            label="GeoLocation"
            checked={form.filters.geoLocation}
            onChange={(value) => setFilter("geoLocation", value)}
            disabled={fieldDisabled(readOnly, isSubmitting)}
          />
          <FilterCheckbox
            label="Unique IP"
            checked={form.filters.uniqueIp}
            onChange={(value) => setFilter("uniqueIp", value)}
            disabled={fieldDisabled(readOnly, isSubmitting)}
          />
          <FilterCheckbox
            label="Checksum"
            checked={form.filters.checksum}
            onChange={(value) => setFilter("checksum", value)}
            disabled={fieldDisabled(readOnly, isSubmitting)}
          />
          <FilterCheckbox
            label="PreScreen"
            checked={form.filters.preScreen}
            onChange={(value) => setFilter("preScreen", value)}
            disabled={fieldDisabled(readOnly, isSubmitting)}
          />
        </div>

        {form.filters.preScreen ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormField label="Select Language" required error={showError("language")}>
              <SearchableSelect
                inputClass={selectClass}
                value={form.language}
                onChange={(next) => setField("language", next)}
                onBlur={() => touch("language")}
                options={LANGUAGE_OPTIONS}
                placeholder="Select Language"
                disabled={fieldDisabled(readOnly, isSubmitting)}
                searchPlaceholder="Search language..."
                aria-label="Select language"
              />
            </FormField>
            <FormField label="Select Survey Group" error={showError("surveyGroup")}>
              <SearchableSelect
                inputClass={selectClass}
                value={form.surveyGroup}
                onChange={(next) => setField("surveyGroup", next)}
                onBlur={() => touch("surveyGroup")}
                options={SURVEY_GROUP_OPTIONS}
                placeholder="Select Survey Group"
                disabled={fieldDisabled(readOnly, isSubmitting)}
                searchPlaceholder="Search survey group..."
                aria-label="Select survey group"
              />
            </FormField>
          </div>
        ) : null}
      </TableCard>

      <TableCard title="Notes" isDarkMode={isDarkMode}>
        <FormField label="Notes">
          <textarea
            className={`${inputClass} min-h-[120px] resize-y py-3`}
            placeholder="Enter Project Notes"
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            disabled={fieldDisabled(readOnly, isSubmitting)}
          />
        </FormField>
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
          onClick={onCancel}
          disabled={isSubmitting}
          className={getAdminCancelButtonClass()}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default RecontactSurveyForm;
