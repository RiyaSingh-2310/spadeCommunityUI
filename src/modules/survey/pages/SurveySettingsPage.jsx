import { useMemo, useState } from "react";
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
import {
  createSurveySettingsForm,
  SURVEY_SETTINGS_LANGUAGE_OPTIONS,
} from "../data/surveySettingsMock";

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

/**
 * Survey Settings — frontend-only mock UI.
 * Persist via API in a follow-up; Submit currently updates local state only.
 */
function SurveySettingsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => createSurveySettingsForm());
  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    createSurveySettingsForm()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { readOnly, showSubmit } = useFormAccess();
  const inputClass = getAdminInputClass();

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
              options={SURVEY_SETTINGS_LANGUAGE_OPTIONS}
              placeholder="Select Language"
              disabled={readOnly}
              searchPlaceholder="Search language..."
              aria-label="Select language"
            />
          </FormField>
        </TableCard>

        <TableCard title="Redirect Content" isDarkMode={isDarkMode}>
          <div className="flex flex-col gap-6">
            {REDIRECT_FIELDS.map(([label, key]) => (
              <FormField key={key} label={label} required error={showError(key)}>
                <RichTextEditor
                  id={`survey-settings-${key}`}
                  contentKey={`survey-settings-${key}`}
                  isDarkMode={isDarkMode}
                  value={form[key]}
                  onChange={(value) => setField(key, value)}
                  onBlur={() => touch(key)}
                  placeholder={`Enter ${label.toLowerCase()}...`}
                  disabled={readOnly}
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
