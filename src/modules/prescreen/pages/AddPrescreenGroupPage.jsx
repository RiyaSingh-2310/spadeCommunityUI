import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import TableCard from "../../../components/admin/TableCard";
import { getAdminInputClass } from "../../shared/utils/formStyles";

const LANGUAGES = ["English", "Arabic", "German", "French", "Spanish"];

function AddPrescreenGroupPage({ isDarkMode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    language: "",
    surveyGroupTitle: "",
    questionnaireList: "",
  });

  const inputClass = getAdminInputClass();

  const canSubmit = useMemo(
    () =>
      form.language.trim() &&
      form.surveyGroupTitle.trim() &&
      form.questionnaireList.trim(),
    [form]
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Add Prescreen Group"
        breadcrumbs={[
          { label: "Prescreen", to: "/prescreen/group" },
          { label: "Prescreen Group", to: "/prescreen/group" },
          { label: "Add Prescreen Group" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Prescreen Group Details" isDarkMode={isDarkMode}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            navigate("/prescreen/group");
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
              <label className="admin-text mb-2 block text-sm font-semibold">Survey Group Title</label>
              <input
                className={inputClass}
                placeholder="Enter Survey Group Title"
                value={form.surveyGroupTitle}
                onChange={(e) => setForm((p) => ({ ...p, surveyGroupTitle: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="admin-text mb-2 block text-sm font-semibold">Questionnaire List</label>
              <textarea
                className={`${inputClass} h-28 py-2`}
                placeholder="Select Questionnaire"
                value={form.questionnaireList}
                onChange={(e) => setForm((p) => ({ ...p, questionnaireList: e.target.value }))}
              />
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
              onClick={() => navigate("/prescreen/group")}
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

export default AddPrescreenGroupPage;
