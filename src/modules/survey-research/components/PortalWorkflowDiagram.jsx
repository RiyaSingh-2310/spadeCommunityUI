import { WORKFLOW_STEPS } from "../data/mockSurveyResearchData";

function PortalWorkflowDiagram() {
  return (
    <div className="srp-workflow">
      {WORKFLOW_STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2">
          <span className="srp-workflow-step">{step.label}</span>
          {index < WORKFLOW_STEPS.length - 1 ? (
            <span className="srp-workflow-arrow" aria-hidden>
              ↓
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default PortalWorkflowDiagram;
