import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import AdminDatePicker from "../../../components/admin/AdminDatePicker";
import DecimalInput from "../../../components/admin/DecimalInput";
import FormField from "../../../components/admin/FormField";
import FormRadioGroup from "../../../components/admin/FormRadioGroup";
import NumericInput from "../../../components/admin/NumericInput";
import RichTextEditor from "../../../components/admin/RichTextEditor";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import TableCard from "../../../components/admin/TableCard";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import {
  ensureSelectOption,
  mapProjectManagersToSelectOptions,
  resolveSelectValue,
} from "../hooks/useSurveyFormSelectOptions";
import { useRecontactPreScreen } from "../hooks/useRecontactPreScreen";
import { getRecords as getProjectManagers } from "../../../services/projectManagers/projectManagersApi";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { isFormValid, limitTextInput, NAME_FIELD_MAX_LENGTH } from "../../shared/utils/validation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  CURRENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  PROJECT_LINK_TYPES,
} from "../data/surveyFormData";
import {
  createEmptyRecontactSurveyForm,
  createRecontactSurvey,
} from "../services/recontactSurveyApi";
import {
  getRecontactSurveyFormErrors,
  isRecontactSurveyFormSubmittable,
  PROJECT_URL_NUMERIC_MAX_DIGITS,
  RECONTACT_SURVEY_FORM_FIELDS,
} from "../utils/recontactSurveyValidation";
import {
  sanitizeProjectUrlDecimal,
  sanitizeProjectUrlInteger,
} from "../utils/projectUrlFormValidation";
import { DEFAULT_SURVEY_LINK_PLACEHOLDER } from "../utils/surveyLinkPlaceholders";

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

function AddRecontactSurveyForm({
  isDarkMode,
  parentSurveyId,
  initialValues = {},
  lockParentFields = false,
  onCancel,
  onSuccess,
}) {
  const { readOnly, showSubmit } = useFormAccess();
  const [form, setForm] = useState(() => ({
    ...createEmptyRecontactSurveyForm(),
    parentSurveyId: parentSurveyId ?? "",
    ...initialValues,
  }));
  const [projectManagerOptions, setProjectManagerOptions] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    surveyGroupOptions,
    questions: preScreenQuestions,
    isLoadingGroups,
    isLoadingQuestions,
  } = useRecontactPreScreen({
    language: form.language,
    surveyGroup: form.surveyGroup,
    enabled: Boolean(form.filters.preScreen),
  });

  const inputClass = getAdminInputClass();
  const selectClass = `${inputClass} appearance-none`;
  const isSingleLink = form.projectLinkType === "Single Link";

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const projectManagers = await getProjectManagers({
          page: 1,
          limit: 100,
        });
        if (!cancelled) {
          setProjectManagerOptions(mapProjectManagersToSelectOptions(projectManagers.items));
        }
      } catch {
        if (!cancelled) {
          setProjectManagerOptions([]);
        }
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
    if (!lockParentFields) return;
    setForm((prev) => ({
      ...prev,
      parentSurveyId: parentSurveyId ?? prev.parentSurveyId,
      client: initialValues.client ?? prev.client,
      projectManager: initialValues.projectManager ?? prev.projectManager,
      projectCountry: initialValues.projectCountry ?? prev.projectCountry,
      currency: initialValues.currency ?? prev.currency,
    }));
  }, [
    lockParentFields,
    parentSurveyId,
    initialValues.client,
    initialValues.projectManager,
    initialValues.projectCountry,
    initialValues.currency,
  ]);

  useEffect(() => {
    const nextManager = resolveSelectValue(
      projectManagerOptions,
      initialValues.projectManager,
      initialValues.projectManagerLabel
    );
    if (!nextManager) return;
    setForm((prev) =>
      prev.projectManager === nextManager ? prev : { ...prev, projectManager: nextManager }
    );
  }, [
    projectManagerOptions,
    initialValues.projectManager,
    initialValues.projectManagerLabel,
  ]);

  useEffect(() => {
    const raw = String(initialValues.currency ?? "").trim();
    if (!raw) return;
    const match = CURRENCY_OPTIONS.find(
      (option) => String(option).toLowerCase() === raw.toLowerCase()
    );
    if (!match) return;
    setForm((prev) => (prev.currency === match ? prev : { ...prev, currency: match }));
  }, [initialValues.currency]);

  const mergedProjectManagerOptions = useMemo(
    () =>
      ensureSelectOption(
        projectManagerOptions,
        form.projectManager,
        initialValues.projectManagerLabel
      ),
    [projectManagerOptions, form.projectManager, initialValues.projectManagerLabel]
  );

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
    !isLoadingOptions &&
    Boolean(form.parentSurveyId);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setFilter = (key, value) =>
    setForm((prev) => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      ...(key === "preScreen" && !value ? { language: "", surveyGroup: "" } : {}),
    }));

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validateSubmit() || !isFormValid(errors) || !isRecontactSurveyFormSubmittable(form)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await createRecontactSurvey(form);
      toastApiSuccess(data);
      onSuccess?.(data);
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <TableCard title="Add Recontact Survey" isDarkMode={isDarkMode}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Client" required error={showError("client")}>
            <input
              className={`${inputClass}${lockParentFields ? " opacity-70" : ""}`}
              placeholder="Enter Client"
              value={form.client}
              onChange={(e) => setField("client", e.target.value)}
              onBlur={() => touch("client")}
              disabled={lockParentFields || fieldDisabled(readOnly, isSubmitting)}
              readOnly={lockParentFields}
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

        <div className="mt-4">
          <FormField label="Project Description">
            <RichTextEditor
              isDarkMode={isDarkMode}
              value={form.description}
              onChange={(value) => setField("description", value)}
              placeholder="Enter Project Description"
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField label="LOI (Minutes)" required error={showError("loi")}>
            <DecimalInput
              className={inputClass}
              placeholder="Enter LOI"
              value={form.loi}
              onChange={(value) => setField("loi", sanitizeProjectUrlDecimal(value))}
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
              options={mergedProjectManagerOptions}
              placeholder="Select Project Manager"
              disabled={fieldDisabled(readOnly, isSubmitting)}
              loading={isLoadingOptions}
              loadingLabel="Loading project managers..."
              searchPlaceholder="Search project manager..."
              aria-label="Select project manager"
            />
          </FormField>

          <FormField label="IR (%)" required error={showError("ir")}>
            <DecimalInput
              className={inputClass}
              placeholder="Enter IR"
              value={form.ir}
              onChange={(value) => setField("ir", sanitizeProjectUrlDecimal(value))}
              onBlur={() => touch("ir")}
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <FormField label="Project Country" required>
            <input
              className={`${inputClass} opacity-70`}
              value={form.projectCountry}
              placeholder="Project Country"
              disabled
              readOnly
            />
          </FormField>

          <FormField label="Sample Size" required error={showError("sampleSize")}>
            <NumericInput
              className={inputClass}
              placeholder="Enter Sample Size"
              value={form.sampleSize}
              maxLength={PROJECT_URL_NUMERIC_MAX_DIGITS}
              onChange={(value) => setField("sampleSize", sanitizeProjectUrlInteger(value))}
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
              maxLength={PROJECT_URL_NUMERIC_MAX_DIGITS}
              onChange={(value) =>
                setField("respondentClickQuota", sanitizeProjectUrlInteger(value))
              }
              onBlur={() => touch("respondentClickQuota")}
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <FormField label="CPI" required error={showError("cpi")}>
            <DecimalInput
              className={inputClass}
              placeholder="Enter CPI"
              value={form.cpi}
              onChange={(value) => setField("cpi", sanitizeProjectUrlDecimal(value))}
              onBlur={() => touch("cpi")}
              disabled={fieldDisabled(readOnly, isSubmitting)}
            />
          </FormField>

          <FormField label="Start Date" required error={showError("startDate")}>
            <AdminDatePicker
              value={form.startDate}
              onChange={(value) => {
                setField("startDate", value);
                touch("startDate");
              }}
              placeholder="Select start date"
              disabled={fieldDisabled(readOnly, isSubmitting)}
              aria-label="Start date"
            />
          </FormField>

          <FormField label="End Date" required error={showError("endDate")}>
            <AdminDatePicker
              value={form.endDate}
              onChange={(value) => {
                setField("endDate", value);
                touch("endDate");
              }}
              placeholder="Select end date"
              disabled={fieldDisabled(readOnly, isSubmitting)}
              aria-label="End date"
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
            <FormField
              label="Live Link"
              required
              error={showError("liveUrl")}
              hint="Must include PID and a supported UID placeholder (identifier or XXXX)"
            >
              <input
                className={inputClass}
                placeholder={DEFAULT_SURVEY_LINK_PLACEHOLDER}
                value={form.liveUrl}
                onChange={(e) => setField("liveUrl", e.target.value)}
                onBlur={() => touch("liveUrl")}
                disabled={fieldDisabled(readOnly, isSubmitting)}
              />
            </FormField>
            <FormField
              label="Test Link"
              error={showError("testUrl")}
              hint="Must include PID and a supported UID placeholder (identifier or XXXX)"
            >
              <input
                className={inputClass}
                placeholder={DEFAULT_SURVEY_LINK_PLACEHOLDER}
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
                onChange={(next) =>
                  setForm((prev) => ({ ...prev, language: next, surveyGroup: "" }))
                }
                onBlur={() => touch("language")}
                options={LANGUAGE_OPTIONS}
                placeholder="Select Language"
                disabled={fieldDisabled(readOnly, isSubmitting)}
                searchPlaceholder="Search language..."
                aria-label="Select language"
              />
            </FormField>
            <FormField label="Select Survey Group">
              <SearchableSelect
                inputClass={selectClass}
                value={form.surveyGroup}
                onChange={(next) => setField("surveyGroup", next)}
                options={surveyGroupOptions}
                placeholder={
                  !form.language
                    ? "Select language first"
                    : isLoadingGroups
                      ? "Loading survey groups..."
                      : surveyGroupOptions.length === 0
                        ? "No survey groups found"
                        : "Select Survey Group"
                }
                disabled={
                  fieldDisabled(readOnly, isSubmitting) || !form.language || isLoadingGroups
                }
                loading={isLoadingGroups}
                loadingLabel="Loading survey groups..."
                searchPlaceholder="Search survey group..."
                aria-label="Select survey group"
              />
            </FormField>
            {/* {form.language ? (
              <div className="md:col-span-2">
                <FormField label="Questions">
                  {isLoadingQuestions ? (
                    <p className="admin-text-muted text-sm">Loading questions...</p>
                  ) : !form.surveyGroup ? (
                    <p className="admin-text-muted text-sm">
                      Select a survey group to load questions for this language.
                    </p>
                  ) : preScreenQuestions.length === 0 ? (
                    <p className="admin-text-muted text-sm">
                      No questions found for this language and survey group.
                    </p>
                  ) : (
                    <ul className="admin-text space-y-1.5 text-sm">
                      {preScreenQuestions.map((question) => (
                        <li key={question.id}>{question.questionTitle}</li>
                      ))}
                    </ul>
                  )}
                </FormField>
              </div>
            ) : null} */}
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

export default AddRecontactSurveyForm;
