import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { toastApiError } from "../../../services/toast/apiToast";
import GroupSurveyProjectDetailsCard from "../components/GroupSurveyProjectDetailsCard";
import { getRecord, mapGroupProjectToDetailsView } from "../services/groupSurveyApi";

function GroupSurveyDetailsPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!id) return undefined;

    let cancelled = false;

    const loadRecord = async () => {
      setIsLoading(true);
      setLoadFailed(false);

      try {
        const project = await getRecord(id);
        if (cancelled) return;
        setDetails(mapGroupProjectToDetailsView(project));
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
        setDetails(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadRecord();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#10a950]" />
      </div>
    );
  }

  if (loadFailed || !details) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Group Survey Details"
          breadcrumbs={[
            { label: "Group Survey", to: "/survey/group" },
            { label: "Details" },
          ]}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text rounded-xl border border-[var(--admin-border)] p-6 text-sm">
          Unable to load group survey details.
          <button
            type="button"
            onClick={() => navigate("/survey/group")}
            className="ml-2 font-semibold text-[#10a950] hover:underline"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Group Survey Details"
        subtitle={details.projectName}
        breadcrumbs={[
          { label: "Group Survey", to: "/survey/group" },
          { label: "Details" },
        ]}
        isDarkMode={isDarkMode}
      />

      <GroupSurveyProjectDetailsCard details={details} isDarkMode={isDarkMode} />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate(`/survey/group/edit/${encodeURIComponent(String(id))}`)}
          className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49]"
        >
          Edit Group Survey
        </button>
        <button
          type="button"
          onClick={() => navigate(`/survey/group/${encodeURIComponent(String(id))}/projects`)}
          className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49]"
        >
          View Projects
        </button>
        <button
          type="button"
          onClick={() => navigate("/survey/group")}
          className="admin-btn-cancel h-11 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back to List
        </button>
      </div>
    </div>
  );
}

export default GroupSurveyDetailsPage;
