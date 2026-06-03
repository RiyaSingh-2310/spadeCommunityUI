import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import TableCard from "../../../components/admin/TableCard";
import { getAdminInputClass } from "../../shared/utils/formStyles";

const LANGUAGES = ["English", "Arabic", "German", "French", "Spanish"];

function AddPrescreenPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    language: "",
    questionTitle: "",
    options: [""],
    mappedOption: "",
    rightAnswer: "",
  });

  const inputClass = getAdminInputClass();
  const filledOptions = form.options.map((o) => o.trim()).filter(Boolean);

  const canSubmit = useMemo(
    () =>
      form.language.trim() &&
      form.questionTitle.trim() &&
      filledOptions.length > 0 &&
      form.mappedOption.trim() &&
      form.rightAnswer.trim(),
    [form, filledOptions.length]
  );

  const addOption = () => {
    setForm((prev) => ({ ...prev, options: [...prev.options, ""] }));
  };

  const updateOption = (index, value) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, idx) => (idx === index ? value : opt)),
    }));
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Add Prescreen"
        breadcrumbs={[
          { label: "Prescreen", to: "/prescreen" },
          { label: "Add Prescreen" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Prescreen Details" isDarkMode={isDarkMode}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            navigate("/prescreen");
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Language</label>
              <select
                className={inputClass}
                value={form.language}
                onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
              >
                <option value="">Select Language</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Question Title</label>
              <input
                className={inputClass}
                placeholder="Enter Question Title"
                value={form.questionTitle}
                onChange={(e) => setForm((p) => ({ ...p, questionTitle: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="admin-text mb-2 block text-sm font-semibold">Add Options</label>
              <div className="space-y-2">
                {form.options.map((option, index) => (
                  <textarea
                    key={`option-${index}`}
                    className={`${inputClass} h-20 py-2`}
                    placeholder="Enter Options"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={addOption}
                className="admin-text mt-2 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition hover:opacity-90"
                style={{ borderColor: "var(--admin-header-search-border)" }}
              >
                <Plus size={16} />
                Add Option
              </button>
            </div>
            <div className="md:col-span-2">
              <label className="admin-text mb-2 block text-sm font-semibold">Mapped Option</label>
              <textarea
                className={`${inputClass} h-20 py-2`}
                placeholder="Enter Mapped Option"
                value={form.mappedOption}
                onChange={(e) => setForm((p) => ({ ...p, mappedOption: e.target.value }))}
              />
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Right Answer</label>
              <select
                className={inputClass}
                value={form.rightAnswer}
                onChange={(e) => setForm((p) => ({ ...p, rightAnswer: e.target.value }))}
              >
                <option value="">Select Right Answer</option>
                {filledOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => navigate("/prescreen")}
              className={`h-11 rounded-xl px-5 text-sm font-semibold ${
                isDarkMode
                  ? "bg-[#1f3047] text-[var(--admin-foreground)]"
                  : "bg-[#eef4fb] text-[var(--admin-foreground)]"
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      </TableCard>
    </div>
  );
}

export default AddPrescreenPage;
