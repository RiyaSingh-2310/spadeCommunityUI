import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import RichTextEditor from "../../../components/admin/RichTextEditor";
import TableCard from "../../../components/admin/TableCard";
import { useAdminFormAccess } from "../../permissions/FormAccessContext";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import {
  getRequiredError,
  getRichTextError,
  isFormValid,
} from "../../shared/utils/validation";

const HOME_PAGE_FIELDS = [
  "title",
  "keyword",
  "description",
  "threeSteps",
  "chooseReward",
  "footerJsx",
];

const DEFAULT_STEPS_HTML =
  "<p><strong>Step 1:</strong> Register your account</p><p><strong>Step 2:</strong> Complete your profile</p><p><strong>Step 3:</strong> Start earning rewards</p>";

const DEFAULT_REWARD_HTML = "<p>Choose the reward that is perfect for you.</p>";

const DEFAULT_FOOTER = `export default function Footer() {
  return (
    <footer className="site-footer">
      <p>© 2026 Speed Community. All rights reserved.</p>
      <nav>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="/contact">Contact Us</a>
      </nav>
    </footer>
  );
}`;

function HomePageManagementPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "Welcome to Speed Community\nJoin Our Panel To Get Reward",
    keyword: "Reward, Surveys, Community",
    description:
      "Speed Community is one of the largest and fastest growing community panels in the world. Join thousands of members who earn rewards by sharing their opinions through surveys.",
    threeSteps: DEFAULT_STEPS_HTML,
    chooseReward: DEFAULT_REWARD_HTML,
    footerJsx: DEFAULT_FOOTER,
  });

  const inputClass = getAdminInputClass();

  const errors = useMemo(
    () => ({
      title: getRequiredError(form.title, "Title"),
      keyword: getRequiredError(form.keyword, "Keyword"),
      description: getRequiredError(form.description, "Description"),
      threeSteps: getRichTextError(form.threeSteps, "Three Simple Steps"),
      chooseReward: getRichTextError(form.chooseReward, "Choose The Reward"),
      footerJsx: getRequiredError(form.footerJsx, "Footer.jsx"),
    }),
    [form]
  );

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: HOME_PAGE_FIELDS,
  });

  const { readOnly, showSubmit, controlDisabled, canSubmitForm } = useAdminFormAccess();
  const canSubmit = canSubmitForm && isFormValid(errors);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Home Page Management" isDarkMode={isDarkMode} />
      <TableCard title="Home Page Configuration" isDarkMode={isDarkMode}>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (readOnly || !showSubmit || !validateSubmit() || !canSubmit) return;
            navigate("/");
          }}
          noValidate
        >
          <div>
            <label className="admin-text mb-2 block text-sm font-semibold">Title</label>
            <input
              className={inputClass}
              placeholder="Enter Title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              onBlur={() => touch("title")}
              disabled={controlDisabled}
              readOnly={readOnly}
            />
            {showError("title") && (
              <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("title")}</p>
            )}
          </div>
          <div>
            <label className="admin-text mb-2 block text-sm font-semibold">Keyword</label>
            <input
              className={inputClass}
              placeholder="Enter Keyword"
              value={form.keyword}
              onChange={(e) => setField("keyword", e.target.value)}
              onBlur={() => touch("keyword")}
              disabled={controlDisabled}
              readOnly={readOnly}
            />
            {showError("keyword") && (
              <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("keyword")}</p>
            )}
          </div>
          <div>
            <label className="admin-text mb-2 block text-sm font-semibold">Description</label>
            <textarea
              className={`${inputClass} min-h-[120px] py-2`}
              placeholder="Enter Description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              onBlur={() => touch("description")}
              disabled={controlDisabled}
              readOnly={readOnly}
            />
            {showError("description") && (
              <p className="mt-1 text-xs text-[var(--admin-danger-text)]">
                {showError("description")}
              </p>
            )}
          </div>
          <div>
            <label className="admin-text mb-2 block text-sm font-semibold">Three Simple Steps</label>
            <RichTextEditor
              isDarkMode={isDarkMode}
              value={form.threeSteps}
              onChange={(v) => setField("threeSteps", v)}
              onBlur={() => touch("threeSteps")}
              placeholder="Enter three simple steps content..."
              disabled={readOnly}
            />
            {showError("threeSteps") && (
              <p className="mt-1 text-xs text-[var(--admin-danger-text)]">
                {showError("threeSteps")}
              </p>
            )}
          </div>
          <div>
            <label className="admin-text mb-2 block text-sm font-semibold">Choose The Reward</label>
            <RichTextEditor
              isDarkMode={isDarkMode}
              value={form.chooseReward}
              onChange={(v) => setField("chooseReward", v)}
              onBlur={() => touch("chooseReward")}
              placeholder="Enter reward section content..."
              disabled={readOnly}
            />
            {showError("chooseReward") && (
              <p className="mt-1 text-xs text-[var(--admin-danger-text)]">
                {showError("chooseReward")}
              </p>
            )}
          </div>
          <div>
            <label className="admin-text mb-2 block text-sm font-semibold">Footer.jsx</label>
            <textarea
              className={`${inputClass} min-h-[180px] font-mono text-xs py-2`}
              placeholder="Footer.jsx"
              value={form.footerJsx}
              onChange={(e) => setField("footerJsx", e.target.value)}
              onBlur={() => touch("footerJsx")}
              spellCheck={false}
              disabled={controlDisabled}
              readOnly={readOnly}
            />
            {showError("footerJsx") && (
              <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("footerJsx")}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {showSubmit && !readOnly && (
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
              onClick={() => navigate("/")}
              className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </TableCard>
    </div>
  );
}

export default HomePageManagementPage;
