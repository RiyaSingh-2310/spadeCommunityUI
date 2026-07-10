import { AlertCircle, ClipboardList, FileQuestion, Link2Off, TimerOff } from "lucide-react";

const EMPTY_STATE_CONFIG = {
  empty: {
    icon: ClipboardList,
    title: "No questions yet",
    description: "This questionnaire does not have any questions yet. Please check back later.",
  },
  expired: {
    icon: TimerOff,
    title: "Survey unavailable",
    description: "This questionnaire is no longer active or has expired.",
  },
  invalid: {
    icon: Link2Off,
    title: "Invalid survey link",
    description: "We could not find this questionnaire. Please check the link and try again.",
  },
  submitted: {
    icon: FileQuestion,
    title: "Already submitted",
    description: "This survey has already been completed. Duplicate submissions are not allowed.",
  },
  error: {
    icon: AlertCircle,
    title: "Questionnaire not available",
    description: "Something went wrong while loading this survey. Please try again later.",
  },
};

function SurveyEmptyState({ variant = "error", title, description }) {
  const config = EMPTY_STATE_CONFIG[variant] ?? EMPTY_STATE_CONFIG.error;
  const Icon = config.icon;

  return (
    <div className="pq-card pq-state-card pq-empty-state" role="alert">
      <div className="pq-empty-icon" aria-hidden>
        <Icon size={32} strokeWidth={1.75} />
      </div>
      <h1 className="pq-empty-title">{title || config.title}</h1>
      <p className="pq-empty-description">{description || config.description}</p>
    </div>
  );
}

export default SurveyEmptyState;
