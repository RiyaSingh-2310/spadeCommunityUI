import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import TableCard from "../../../components/admin/TableCard";

const CLIENTS = ["Alpha Corp", "Beta Labs", "Gamma Tech", "Delta Works"];
const PROJECTS = ["Group Wave 1", "Group Wave 2", "Panel Sync Study", "Community Panel Q3"];

function getDemoGroupSurvey(id) {
  const numId = Number(String(id).replace(/\D/g, "")) || 1;
  return {
    id: String(id),
    clientName: CLIENTS[(numId - 1) % CLIENTS.length],
    projectName: PROJECTS[(numId - 1) % PROJECTS.length],
    status: numId % 5 === 0 ? "Inactive" : "Active",
  };
}

function GroupSurveyDetailsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const record = useMemo(() => getDemoGroupSurvey(id), [id]);

  const fields = [
    ["Client Name", record.clientName],
    ["Project Name", record.projectName],
    ["Status", record.status],
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Group Survey Details"
        subtitle={`Group survey ${id}`}
        breadcrumbs={[
          { label: "Group Survey", to: "/survey/group" },
          { label: "Details" },
        ]}
        isDarkMode={isDarkMode}
      />

      <TableCard title="Group Survey Information" isDarkMode={isDarkMode}>
        <dl className="grid gap-4 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt className="admin-text-muted mb-1 text-xs font-semibold uppercase tracking-wide">
                {label}
              </dt>
              <dd className="admin-text text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate(`/survey/group/edit/${encodeURIComponent(id)}`)}
            className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49]"
          >
            Edit Group Survey
          </button>
          <button
            type="button"
            onClick={() => navigate("/survey/group")}
            className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back to List
          </button>
        </div>
      </TableCard>
    </div>
  );
}

export default GroupSurveyDetailsPage;
