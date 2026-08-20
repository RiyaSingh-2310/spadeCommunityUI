import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  DEFAULT_SURVEY_PAGE_ID,
  getSurveyPage,
  mapSurveyPageToForm,
  updateSurveyPage,
} from "../services/surveyPagesApi";

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

const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "German", "Hindi"];

const EMPTY_CONTENT_FORM = {
  completeRedirect: "",
  terminateRedirect: "",
  overQuotaRedirect: "",
  qualityTermRedirect: "",
  surveyCloseRedirect: "",
};

function SurveySettingsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    language: "English",
    ...EMPTY_CONTENT_FORM,
  });
  const [surveyPageId, setSurveyPageId] = useState(DEFAULT_SURVEY_PAGE_ID);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { readOnly, showSubmit } = useFormAccess();
  const inputClass = getAdminInputClass();

  useEffect(() => {
    let cancelled = false;

    const loadSurveyPage = async () => {
      setIsLoading(true);
      setLoadFailed(false);

      try {
        const record = await getSurveyPage(DEFAULT_SURVEY_PAGE_ID);
        if (cancelled) return;

        const mapped = mapSurveyPageToForm(record);
        setSurveyPageId(record?.id ?? DEFAULT_SURVEY_PAGE_ID);
        setForm((prev) => ({ ...prev, ...mapped }));
        setInitialSnapshot(mapped);
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSurveyPage();
    return () => {
      cancelled = true;
    };
  }, []);

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

    return SURVEY_CONTENT_FIELDS.some(
      (key) => String(form[key] ?? "") !== String(initialSnapshot[key] ?? "")
    );
  }, [form, initialSnapshot]);

  const canSubmit =
    showSubmit &&
    !readOnly &&
    isFormValidForFields(errors, SURVEY_SETTINGS_FIELDS) &&
    !isSubmitting &&
    !isLoading &&
    !loadFailed &&
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
      const data = await updateSurveyPage(surveyPageId, form);
      const updated = mapSurveyPageToForm(data?.data ?? {});
      setForm((prev) => ({ ...prev, ...updated }));
      setInitialSnapshot(updated);
      toastApiSuccess(data);
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const richFields = [
    ["Complete Redirect Content", "completeRedirect"],
    ["Terminate Redirect Content", "terminateRedirect"],
    ["Over Quota Redirect Content", "overQuotaRedirect"],
    ["Quality Term Redirect Content", "qualityTermRedirect"],
    ["Survey Close Redirect Content", "surveyCloseRedirect"],
  ];

  if (isLoading) {
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
          title="Survey Settings"
          subtitle="Configure survey language and redirect content."
          isDarkMode={isDarkMode}
        />
        <div className="admin-text rounded-xl border border-[var(--admin-border)] p-6 text-sm">
          Unable to load survey settings.
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-2 font-semibold text-[#10a950] hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Survey Settings"
        subtitle="Configure survey language and redirect content."
        isDarkMode={isDarkMode}
      />

      <form onSubmit={onSubmit} className="space-y-5">
        <TableCard title="General" isDarkMode={isDarkMode}>
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
              options={LANGUAGE_OPTIONS}
              placeholder="Select Language"
              disabled={readOnly}
              searchPlaceholder="Search language..."
              aria-label="Select language"
            />
          </FormField>
        </TableCard>

        <TableCard title="Redirect Content" isDarkMode={isDarkMode}>
          <div className="flex flex-col gap-6">
            {richFields.map(([label, key]) => (
              <FormField
                key={key}
                label={label}
                required
                error={showError(key)}
              >
                <RichTextEditor
                  isDarkMode={isDarkMode}
                  value={form[key]}
                  onChange={(value) => setField(key, value)}
                  onBlur={() => touch(key)}
                  placeholder={`Enter ${label.toLowerCase()}...`}
                  disabled={readOnly}
                  initiallyCollapsed
                  height={240}
                  compactHeight={140}
                />
              </FormField>
            ))}
          </div>
        </TableCard>

        <div className="flex flex-wrap items-center gap-3">
          {showSubmit && (
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
          )}
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
