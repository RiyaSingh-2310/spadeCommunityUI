import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import LanguageSelect from "../../../components/admin/LanguageSelect";
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
import { ApiError } from "../../../services/api/ApiError";
import {
  resolveApiToastMessage,
  toastApiError,
  toastApiSuccess,
  toastApiWarning,
} from "../../../services/toast/apiToast";
import { resetSurveySettingsViewAfterSave } from "../utils/resetSurveySettingsView";
import {
  buildSurveySettingsUpdatePayload,
  createEmptySurveySettingsForm,
  DEFAULT_SURVEY_SETTINGS_LANGUAGE,
  findUnpersistedContentKeys,
  getSurveySettingsByLanguage,
  getSurveySettingsIdForLanguage,
  SURVEY_SETTINGS_CONTENT_KEYS,
  updateSurveySettingsByLanguage,
} from "../services/surveySettingsApi";

const SURVEY_SETTINGS_FIELDS = ["language", ...SURVEY_SETTINGS_CONTENT_KEYS];

const REDIRECT_FIELDS = [
  ["Complete Redirect Content", "completeRedirect"],
  ["Terminate Redirect Content", "terminateRedirect"],
  ["Quality Term Redirect Content", "qualityTermRedirect"],
  ["Survey Close Redirect Content", "surveyCloseRedirect"],
];

const REDIRECT_FIELD_LABELS = Object.fromEntries(
  REDIRECT_FIELDS.map(([label, key]) => [key, label])
);

/** @param {import("../types/surveySettings").SurveySettingsFormValues} details */
function toFormValues(details) {
  const next = createEmptySurveySettingsForm(details.language);
  SURVEY_SETTINGS_CONTENT_KEYS.forEach((key) => {
    next[key] = details[key];
  });
  return next;
}

/** Half-viewport editor height so large redirect HTML/code is readable. */
function getSurveySettingsRedirectEditorHeight() {
  if (typeof window === "undefined") return 480;
  return Math.max(420, Math.round(window.innerHeight * 0.5));
}

/**
 * Survey Settings — language dropdown uses the complete language catalog.
 * Redirect content is loaded per language from
 * GET /api/survey-settings/public/language/:language and saved through
 * PUT /api/survey-settings/:id (id mapped from the language).
 */
function SurveySettingsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() =>
    createEmptySurveySettingsForm(DEFAULT_SURVEY_SETTINGS_LANGUAGE)
  );
  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    createEmptySurveySettingsForm(DEFAULT_SURVEY_SETTINGS_LANGUAGE)
  );
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settingsRequest, setSettingsRequest] = useState({
    language: DEFAULT_SURVEY_SETTINGS_LANGUAGE,
    attempt: 0,
  });
  const { readOnly, showSubmit } = useFormAccess();
  const inputClass = getAdminInputClass();
  const redirectEditorHeight = useMemo(
    () => getSurveySettingsRedirectEditorHeight(),
    []
  );

  useEffect(() => {
    const { language } = settingsRequest;
    let cancelled = false;

    const loadLanguageSettings = async () => {
      try {
        const next = toFormValues(await getSurveySettingsByLanguage(language));
        if (cancelled) return;
        setForm(next);
        setInitialSnapshot(next);
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          resolveApiToastMessage(error, `Unable to load ${language} survey settings.`)
        );
        toastApiError(error);
      } finally {
        if (!cancelled) setIsLoadingSettings(false);
      }
    };

    loadLanguageSettings();
    return () => {
      cancelled = true;
    };
  }, [settingsRequest]);

  /** Clears the editors before fetching so another language's content is never shown. */
  const loadSettings = (language) => {
    const empty = createEmptySurveySettingsForm(language);
    setForm(empty);
    setInitialSnapshot(empty);
    setLoadError("");
    setIsLoadingSettings(true);
    setSettingsRequest((prev) => ({ language, attempt: prev.attempt + 1 }));
  };

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
      SURVEY_SETTINGS_CONTENT_KEYS.some(
        (key) => String(form[key] ?? "") !== String(initialSnapshot[key] ?? "")
      )
    );
  }, [form, initialSnapshot]);

  const selectedSettingsId = useMemo(
    () => getSurveySettingsIdForLanguage(form.language),
    [form.language]
  );

  const isSettingsReady = !isLoadingSettings && !loadError;

  const canSubmit =
    showSubmit &&
    !readOnly &&
    Boolean(selectedSettingsId) &&
    isSettingsReady &&
    isFormValidForFields(errors, SURVEY_SETTINGS_FIELDS) &&
    !isSubmitting &&
    isDirty;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onLanguageChange = (language) => {
    loadSettings(language);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (
      readOnly ||
      !showSubmit ||
      !isSettingsReady ||
      !validateSubmit() ||
      !isFormValidForFields(errors, SURVEY_SETTINGS_FIELDS) ||
      !isDirty
    ) {
      return;
    }

    if (!selectedSettingsId) {
      toastApiError({ message: "Select a language before saving survey settings." });
      return;
    }

    const { language } = form;
    const submittedForm = { ...form };
    const sentPayload = buildSurveySettingsUpdatePayload(submittedForm);

    setIsSubmitting(true);
    try {
      const data = await updateSurveySettingsByLanguage(language, submittedForm);
      toastApiSuccess(data, "Survey setting updated successfully!");
    } catch (error) {
      toastApiError(error);
      setIsSubmitting(false);
      return;
    }

    try {
      const persisted = toFormValues(await getSurveySettingsByLanguage(language));
      setForm(persisted);
      setInitialSnapshot(persisted);
      const unpersisted = findUnpersistedContentKeys(sentPayload, persisted);
      if (unpersisted.length) {
        toastApiWarning(
          `Saved, but the server returned different content for: ${unpersisted
            .map((key) => REDIRECT_FIELD_LABELS[key])
            .join(", ")}.`
        );
      }
    } catch (error) {
      setInitialSnapshot(submittedForm);
      if (!(error instanceof ApiError && error.sessionExpired)) {
        toastApiError({
          message: `Saved, but reloading ${language} survey settings failed: ${resolveApiToastMessage(
            error,
            "Request failed"
          )}`,
        });
      }
    } finally {
      setIsSubmitting(false);
    }

    window.requestAnimationFrame(() => {
      resetSurveySettingsViewAfterSave();
    });
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
            error={showError("language") || loadError}
            hint={
              isLoadingSettings && form.language
                ? `Loading ${form.language} survey settings...`
                : undefined
            }
          >
            <LanguageSelect
              inputClass={inputClass}
              value={form.language}
              onChange={onLanguageChange}
              onBlur={() => touch("language")}
              disabled={readOnly || isSubmitting}
            />
            {loadError && selectedSettingsId ? (
              <button
                type="button"
                onClick={() => loadSettings(form.language)}
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
                error={isSettingsReady ? showError(key) : ""}
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
                  disabled={readOnly || !isSettingsReady || isSubmitting}
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
