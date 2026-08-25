import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { SURVEY_RESEARCH_API_UNAVAILABLE_MESSAGE } from "../data/surveyResearchData";
import { toastApiError } from "../../../services/toast/apiToast";

const EMPTY_FORM = {
  groupName: "",
  language: "English",
  questionnaireTitle: "",
  status: "Draft",
  estimatedLoi: "5 min",
};

function PreScreenerGroupFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(EMPTY_FORM);
  const isSaving = false;

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    toastApiError(new Error(SURVEY_RESEARCH_API_UNAVAILABLE_MESSAGE));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/survey-research/pre-screener-groups" className="srp-btn-ghost !p-2">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? "Edit Pre-Screener Group" : "Add Pre-Screener Group"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--srp-text-muted)" }}>
            Demo form — changes are not persisted to a backend.
          </p>
        </div>
      </div>

      <form className="srp-card space-y-5 p-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Group Name</span>
            <input
              required
              value={form.groupName}
              onChange={(event) => updateField("groupName", event.target.value)}
              className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm"
              style={{ borderColor: "var(--srp-border)", background: "var(--srp-surface)" }}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Questionnaire Title</span>
            <input
              required
              value={form.questionnaireTitle}
              onChange={(event) => updateField("questionnaireTitle", event.target.value)}
              className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm"
              style={{ borderColor: "var(--srp-border)", background: "var(--srp-surface)" }}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Language</span>
            <select
              value={form.language}
              onChange={(event) => updateField("language", event.target.value)}
              className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm"
              style={{ borderColor: "var(--srp-border)", background: "var(--srp-surface)" }}
            >
              <option>English</option>
              <option>German</option>
              <option>French</option>
              <option>Spanish</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Estimated LOI</span>
            <input
              value={form.estimatedLoi}
              onChange={(event) => updateField("estimatedLoi", event.target.value)}
              className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm"
              style={{ borderColor: "var(--srp-border)", background: "var(--srp-surface)" }}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Status</span>
            <select
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
              className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm"
              style={{ borderColor: "var(--srp-border)", background: "var(--srp-surface)" }}
            >
              <option>Active</option>
              <option>Inactive</option>
              <option>Draft</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: "var(--srp-border)" }}>
          <button type="submit" className="srp-btn-primary" disabled={isSaving}>
            <Save size={16} />
            {isSaving ? "Saving..." : isEdit ? "Update Group" : "Create Group"}
          </button>
          <Link to="/survey-research/pre-screener-groups" className="srp-btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default PreScreenerGroupFormPage;
