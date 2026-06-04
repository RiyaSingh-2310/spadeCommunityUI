import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import RichTextEditor from "../../../components/admin/RichTextEditor";
import TableCard from "../../../components/admin/TableCard";
import { fieldDisabled, useFormAccess } from "../../permissions/FormAccessContext";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import {
  getRequiredError,
  getRichTextError,
  isFormValid,
} from "../../shared/utils/validation";

const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "German", "Hindi"];

const DEFAULT_CONTENT = {
  completeRedirect: "Speed Community Survey Completion Content",
  terminateRedirect: "Speed Community Termination Content",
  overQuotaRedirect: "Speed Community Over Quota Content",
  qualityTermRedirect: "Speed Community Quality Termination Content",
  surveyCloseRedirect: "Speed Community Survey Closed Content",
};

function SurveySettingsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    language: "English",
    ...DEFAULT_CONTENT,
  });
  const [touched, setTouched] = useState(false);
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

  const canSubmit = showSubmit && !readOnly && isFormValid(errors);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (readOnly || !showSubmit || !canSubmit) return;
    navigate("/survey/settings", { replace: true });
  };

  const richFields = [
    ["Complete Redirect Content", "completeRedirect"],
    ["Terminate Redirect Content", "terminateRedirect"],
    ["Over Quota Redirect Content", "overQuotaRedirect"],
    ["Quality Term Redirect Content", "qualityTermRedirect"],
    ["Survey Close Redirect Content", "surveyCloseRedirect"],
  ];

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
            error={touched ? errors.language : ""}
          >
            <select
              className={inputClass}
              value={form.language}
              onChange={(e) => setField("language", e.target.value)}
              onBlur={() => setTouched(true)}
              disabled={readOnly}
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </FormField>
        </TableCard>

        <TableCard title="Redirect Content" isDarkMode={isDarkMode}>
          <div className="flex flex-col gap-6">
            {richFields.map(([label, key]) => (
              <FormField
                key={key}
                label={label}
                required
                error={touched ? errors[key] : ""}
              >
                <RichTextEditor
                  isDarkMode={isDarkMode}
                  value={form[key]}
                  onChange={(value) => setField(key, value)}
                  placeholder={`Enter ${label.toLowerCase()}...`}
                  disabled={readOnly}
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
            Submit
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
