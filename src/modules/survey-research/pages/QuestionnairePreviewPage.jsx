import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PortalStatusBadge from "../components/PortalStatusBadge";
import { getPreScreenerGroupById } from "../data/mockSurveyResearchData";

function QuestionnairePreviewPage() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setGroup(getPreScreenerGroupById(id));
      setIsLoading(false);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [id]);

  if (isLoading) {
    return (
      <div className="srp-card p-12 text-center text-sm" style={{ color: "var(--srp-text-muted)" }}>
        Loading questionnaire preview...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="srp-card space-y-4 p-10 text-center">
        <p className="text-lg font-semibold">Questionnaire not found</p>
        <p className="text-sm" style={{ color: "var(--srp-text-muted)" }}>
          The selected pre-screener group does not exist in the demo dataset.
        </p>
        <Link to="/survey-research/pre-screener-groups" className="srp-btn-primary inline-flex">
          Back to Groups
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/survey-research/pre-screener-groups" className="srp-btn-ghost !p-2">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--srp-text-muted)" }}>
            Questionnaire Preview
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{group.questionnaireTitle}</h1>
        </div>
      </div>

      <div className="srp-card grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--srp-text-muted)" }}>
            Language
          </p>
          <p className="mt-1 font-medium">{group.language}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--srp-text-muted)" }}>
            Estimated LOI
          </p>
          <p className="mt-1 font-medium">{group.estimatedLoi}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--srp-text-muted)" }}>
            Status
          </p>
          <div className="mt-1">
            <PortalStatusBadge status={group.status} />
          </div>
        </div>
      </div>

      <div className="srp-card divide-y" style={{ borderColor: "var(--srp-border)" }}>
        {group.questions.map((question, index) => (
          <div key={question.id} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--srp-text-muted)" }}>
              Question {index + 1}
            </p>
            <p className="mt-2 text-base font-medium">{question.text}</p>
            <div
              className="mt-3 rounded-xl border px-4 py-3 text-sm"
              style={{ borderColor: "var(--srp-border)", background: "var(--srp-surface-muted)", color: "var(--srp-text-muted)" }}
            >
              {question.type === "multi" ? "Multi-select response (demo)" : "Single-select response (demo)"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuestionnairePreviewPage;
