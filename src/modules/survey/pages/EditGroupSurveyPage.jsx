import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import FormField from "../../../components/admin/FormField";
import TableCard from "../../../components/admin/TableCard";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { getRequiredError, isFormValid } from "../../shared/utils/validation";

const CLIENTS = ["Alpha Corp", "Beta Labs", "Gamma Tech", "Delta Works"];
const PROJECTS = ["Group Wave 1", "Group Wave 2", "Panel Sync Study", "Community Panel Q3"];

function getDemoGroupSurvey(id) {
  const numId = Number(String(id).replace(/\D/g, "")) || 1;
  return {
    clientName: CLIENTS[(numId - 1) % CLIENTS.length],
    projectName: PROJECTS[(numId - 1) % PROJECTS.length],
  };
}

function EditGroupSurveyPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const initial = useMemo(() => getDemoGroupSurvey(id), [id]);
  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputClass = getAdminInputClass();

  const errors = useMemo(
    () => ({
      clientName: getRequiredError(form.clientName, "Client Name"),
      projectName: getRequiredError(form.projectName, "Project Name"),
    }),
    [form]
  );

  const canSubmit = isFormValid(errors) && !isSubmitting;

  const onSubmit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isFormValid(errors)) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsSubmitting(false);
    navigate("/survey/group", { replace: true });
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Edit Group Survey"
        subtitle={`Group survey ${id}`}
        breadcrumbs={[
          { label: "Group Survey", to: "/survey/group" },
          { label: "Edit" },
        ]}
        isDarkMode={isDarkMode}
      />

      <form onSubmit={onSubmit} className="space-y-5">
        <TableCard title="Group Survey Details" isDarkMode={isDarkMode}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Client Name"
              required
              error={touched ? errors.clientName : ""}
            >
              <input
                className={inputClass}
                value={form.clientName}
                onChange={(e) => setField("clientName", e.target.value)}
                onBlur={() => setTouched(true)}
                disabled={isSubmitting}
              />
            </FormField>
            <FormField
              label="Project Name"
              required
              error={touched ? errors.projectName : ""}
            >
              <input
                className={inputClass}
                value={form.projectName}
                onChange={(e) => setField("projectName", e.target.value)}
                onBlur={() => setTouched(true)}
                disabled={isSubmitting}
              />
            </FormField>
          </div>
        </TableCard>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? "Updating..." : "Update"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/survey/group")}
            disabled={isSubmitting}
            className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditGroupSurveyPage;
