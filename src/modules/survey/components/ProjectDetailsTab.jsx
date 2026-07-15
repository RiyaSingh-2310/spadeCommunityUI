import TableCard from "../../../components/admin/TableCard";
import { DetailField, DetailGrid, SectionDivider } from "./surveyDetailsShared";

function ProjectDetailsTab({ project, isDarkMode }) {
  return (
    <div className="space-y-0">
      <TableCard title="Project Information" isDarkMode={isDarkMode}>
        <DetailGrid>
          <DetailField label="ID" value={project.recordId ?? project.id} />
          <DetailField label="Project Name" value={project.projectName} />
          <DetailField label="Project Code" value={project.projectCode || project.surveyId} />
          <DetailField label="Client" value={project.clientName} />
          <DetailField label="Project Manager" value={project.projectManager} />
          <DetailField label="Sales Manager" value={project.salesManager} />
          <DetailField
            label="Sales Project (RFQ)"
            value={project.salesProject || project.rfq}
          />
          <DetailField label="Project Link Type" value={project.projectLinkType} />
          <DetailField label="Status" value={project.projectStatus} />
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
