import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import RichTextEditor from "../../../components/admin/RichTextEditor";
import TableCard from "../../../components/admin/TableCard";
import { useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import {
  getRequiredError,
  getRichTextError,
  isFormValidForFields,
} from "../../shared/utils/validation";
import toast from "../../../services/toast/toast";
import { toastApiError } from "../../../services/toast/apiToast";
import { createSurveySettingsForm } from "../data/surveySettingsMock";
import {
  listAllSurveySettings,
  mapSurveySettingsToLanguageOptions,
} from "../services/surveySettingsApi";

const SURVEY_SETTINGS_FIELDS = [
  "language",
  "completeRedirect",
  "terminateRedirect",
  "overQuotaRedirect",
  "qualityTermRedirect",
  "surveyCloseRedirect",
];

const SURVEY_CONTENT_FIELDS = [
  "completeRedirect",
  "terminateRedirect",
  "overQuotaRedirect",
  "qualityTermRedirect",
  "surveyCloseRedirect",
];

const REDIRECT_FIELDS = [
  ["Complete Redirect Content", "completeRedirect"],
  ["Terminate Redirect Content", "terminateRedirect"],
  ["Over Quota Redirect Content", "overQuotaRedirect"],
  ["Quality Term Redirect Content", "qualityTermRedirect"],
  ["Survey Close Redirect Content", "surveyCloseRedirect"],
];

/** Half-viewport editor height so large redirect HTML/code is readable. */
function getSurveySettingsRedirectEditorHeight() {
  if (typeof window === "undefined") return 480;
  return Math.max(420, Math.round(window.innerHeight * 0.5));
}

/**
 * Survey Settings — languages load from GET /api/survey-settings/list.
 * Redirect content remains local until a settings-by-language content API is added.
 */
function SurveySettingsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => createSurveySettingsForm({ language: "" }));
  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    createSurveySettingsForm({ language: "" })
  );
  const [languageOptions, setLanguageOptions] = useState([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);
  const [languagesFailed, setLanguagesFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { readOnly, showSubmit } = useFormAccess();
  const inputClass = getAdminInputClass();
  const redirectEditorHeight = useMemo(
    () => getSurveySettingsRedirectEditorHeight(),
    []
  );

  const loadLanguages = useCallback(async () => {
    setIsLoadingLanguages(true);
    setLanguagesFailed(false);
    try {
      const items = await listAllSurveySettings();
      const options = mapSurveySettingsToLanguageOptions(items);
      setLanguageOptions(options);

      const pickLanguage = (current) => {
        const value = String(current ?? "").trim();
        const stillValid = options.some((option) => option.value === value);
        return stillValid ? value : options[0]?.value ?? "";
      };

      setForm((prev) => ({ ...prev, language: pickLanguage(prev.language) }));
      setInitialSnapshot((prev) => ({
        ...prev,
        language: pickLanguage(prev.language),
      }));
    } catch (error) {
      toastApiError(error);
      setLanguageOptions([]);
      setLanguagesFailed(true);
    } finally {
      setIsLoadingLanguages(false);
    }
  }, []);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  const errors = useMemo(
    () => ({
      language: getRequiredError(form.language, "Language"),
      completeRedirect: getRichTextError(
        form.completeRedirect,
        "Complete Redirect Content"
      ),
      terminateRedirect: getRichTextError(
        form.terminateRedirect,
        "Terminate Redirect Content"
      ),
      overQuotaRedirect: getRichTextError(
        form.overQuotaRedirect,
        "Over Quota Redirect Content"
      ),
      qualityTermRedirect: getRichTextError(
        form.qualityTermRedirect,
        "Quality Term Redirect Content"
      ),
      surveyCloseRedirect: getRichTextError(
        form.surveyCloseRedirect,
        "Survey Close Redirect Content"
      ),
    }),
    [form]
  );

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: SURVEY_SETTINGS_FIELDS,
  });

  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;

    return (
      String(form.language ?? "") !== String(initialSnapshot.language ?? "") ||
      SURVEY_CONTENT_FIELDS.some(
        (key) => String(form[key] ?? "") !== String(initialSnapshot[key] ?? "")
      )
    );
  }, [form, initialSnapshot]);

  const canSubmit =
    showSubmit &&
    !readOnly &&
    isFormValidForFields(errors, SURVEY_SETTINGS_FIELDS) &&
    !isSubmitting &&
    isDirty;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    if (
      readOnly ||
      !showSubmit ||
      !validateSubmit() ||
      !isFormValidForFields(errors, SURVEY_SETTINGS_FIELDS) ||
      !isDirty
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const nextSnapshot = { ...form };
      setInitialSnapshot(nextSnapshot);
      toast.success("Survey settings saved locally (mock). API integration pending.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Survey Settings"
        subtitle="Configure survey language and redirect content."
        isDarkMode={isDarkMode}
      />

      <form onSubmit={onSubmit} className="space-y-5">
        <TableCard title="Language Redirect" isDarkMode={isDarkMode}>
          <FormField
            className="max-w-md"
            label="Language"
            required
            error={showError("language")}
          >
            <SearchableSelect
              inputClass={inputClass}
              value={form.language}
              onChange={(language) => setField("language", language)}
              onBlur={() => touch("language")}
              options={languageOptions}
              placeholder="Select Language"
              disabled={readOnly || isLoadingLanguages}
              loading={isLoadingLanguages}
              loadingLabel="Loading languages..."
              emptyMessage={
                languagesFailed
                  ? "Unable to load languages"
                  : "No languages found"
              }
              searchPlaceholder="Search language..."
              aria-label="Select language"
            />
            {languagesFailed ? (
              <button
                type="button"
                onClick={loadLanguages}
                className="mt-2 text-sm font-semibold text-[#10a950] hover:underline"
              >
                Retry
              </button>
            ) : null}
          </FormField>
        </TableCard>

        <TableCard title="Redirect Content" isDarkMode={isDarkMode}>
          <div className="flex flex-col gap-8">
            {REDIRECT_FIELDS.map(([label, key]) => (
              <FormField
                key={key}
                className="survey-settings-redirect-field"
                label={label}
                required
                error={showError(key)}
              >
                <RichTextEditor
                  id={`survey-settings-${key}`}
                  contentKey={`survey-settings-${key}`}
                  className="survey-settings-redirect-editor"
                  isDarkMode={isDarkMode}
                  value={form[key]}
                  onChange={(value) => setField(key, value)}
                  onBlur={() => touch(key)}
                  placeholder={`Enter ${label.toLowerCase()}...`}
                  disabled={readOnly}
                  height={redirectEditorHeight}
                  minHeight={redirectEditorHeight}
                />
              </FormField>
            ))}
          </div>
        </TableCard>

        <div className="flex flex-wrap items-center gap-3">
          {showSubmit ? (
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Submit"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => navigate("/survey")}
            className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default SurveySettingsPage;
