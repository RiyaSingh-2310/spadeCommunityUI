import { useState } from "react";
import TableCard from "../../../components/admin/TableCard";
import { sanitizeHtml } from "../../shared/utils/sanitizeHtml";
import { DetailField, DetailGrid, SectionDivider } from "./surveyDetailsShared";

function hasRenderableHtml(value) {
  const text = String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return Boolean(text);
}

function ExpandableHtmlDescription({ html, isDarkMode }) {
  const [expanded, setExpanded] = useState(false);

  if (!hasRenderableHtml(html)) {
    return <span className="admin-text">—</span>;
  }

  const sanitized = sanitizeHtml(html);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="text-sm font-semibold text-[#10a950] hover:underline"
      >
        {expanded ? "Collapse description" : "Expand description"}
      </button>
      <div
        className={`admin-text overflow-auto rounded-xl border px-4 py-3 text-sm leading-relaxed ${
          expanded ? "min-h-[280px] max-h-[70vh]" : "max-h-24"
        }`}
        style={{
          borderColor: "var(--admin-input-border)",
          background: isDarkMode
            ? "var(--admin-input-bg)"
            : "var(--admin-header-surface)",
        }}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    </div>
  );
}

function ProjectDetailsTab({ project, isDarkMode }) {
  return (
    <div className="space-y-0">
      <TableCard title="Project Information" isDarkMode={isDarkMode}>
        <DetailGrid>
          <DetailField label="ID" value={project.recordId ?? project.id} />
          <DetailField label="Project Name" value={project.projectName} />
          <DetailField label="Project Code" value={project.projectCode || project.surveyId} copySuccessMessage="Project Code copied" copyLabel="Copy Project Code" />
          <DetailField label="Client" value={project.clientName} />
          <DetailField label="Project Manager" value={project.projectManager} />
          <DetailField label="Sales Manager" value={project.salesManager} />
          <DetailField
            label="Sales Project (RFQ)"
            value={project.salesProject || project.rfq}
          />
          {/* <DetailField label="Project Link Type" value={project.projectLinkType} /> */}
          <DetailField label="Status" value={project.projectStatus} />
          <DetailField
            label="Description"
            value={
              <ExpandableHtmlDescription
                html={project.description}
                isDarkMode={isDarkMode}
              />
            }
            className="sm:col-span-2"
          />
          <DetailField
            label="Notes"
            value={project.note}
            className="sm:col-span-2"
          />
        </DetailGrid>
      </TableCard>

      <SectionDivider />

      
    </div>
  );
}

export default ProjectDetailsTab;
