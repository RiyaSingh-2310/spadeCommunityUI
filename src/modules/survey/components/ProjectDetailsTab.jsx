import TableCard from "../../../components/admin/TableCard";
import { formatCountryLabel } from "../../../services/countries/countriesApi";
import {
  getSupplierLinksRows,
  getSupplierMappedLiveRows,
  getSupplierMappedTestRows,
} from "../data/surveyDetailsData";
import {
  DetailField,
  DetailGrid,
  FilterCheckbox,
  ReadOnlyUrl,
  SectionDivider,
  SurveyDataTable,
} from "./surveyDetailsShared";

function ProjectDetailsTab({ project, isDarkMode }) {
  const liveRows = getSupplierMappedLiveRows();
  const testRows = getSupplierMappedTestRows();
  const linkRows = getSupplierLinksRows();

  const liveColumns = [
    "S No",
    "Supplier Code",
    "Supplier Name",
    "Total Respondent",
    "Complete",
    "Dropout",
    "Terminate",
    "Over Quota",
    "Quality Term",
    "Survey Close",
  ];

  const testColumns = liveColumns.filter((c) => c !== "Survey Close");

  const linkColumns = [
    "S No",
    "Supplier Code",
    "Supplier Name",
    "Link",
    "Supplier Quota",
    "CPI",
    "Cost Ratio",
    "LOI (Minutes)",
    "IR",
  ];

  const renderMappedCell = (row, col) => {
    const map = {
      "S No": row.sno,
      "Supplier Code": row.supplierCode,
      "Supplier Name": row.supplierName,
      "Total Respondent": row.totalRespondent,
      Complete: row.complete,
      Dropout: row.dropout,
      Terminate: row.terminate,
      "Over Quota": row.overQuota,
      "Quality Term": row.qualityTerm,
      "Survey Close": row.surveyClose,
    };
    return map[col] ?? "—";
  };

  const renderLinkCell = (row, col) => {
    if (col === "Link") {
      return <ReadOnlyUrl url={row.link} />;
    }
    const map = {
      "S No": row.sno,
      "Supplier Code": row.supplierCode,
      "Supplier Name": row.supplierName,
      "Supplier Quota": row.supplierQuota,
      CPI: row.cpi,
      "Cost Ratio": row.costRatio,
      "LOI (Minutes)": row.loiMinutes,
      IR: row.ir,
    };
    return map[col] ?? "—";
  };

  return (
    <div className="space-y-0">
      <TableCard title="Project Information" isDarkMode={isDarkMode}>
        <DetailGrid>
          <DetailField label="Client Name" value={project.clientName} />
          <DetailField label="Project Name" value={project.projectName} />
          <DetailField label="Project Manager" value={project.projectManager} />
          <DetailField
            label="Project Country"
            value={formatCountryLabel(project.projectCountry)}
          />
          <DetailField label="Description" value={project.description} className="sm:col-span-2" />
          <DetailField label="Survey ID" value={project.surveyId} />
          <DetailField label="Sales Manager" value={project.salesManager} />
          <DetailField label="Sales Project" value={project.salesProject} />
        </DetailGrid>
      </TableCard>

      <SectionDivider />

      <TableCard title="Survey Metrics" isDarkMode={isDarkMode}>
        <DetailGrid columns={3}>
          <DetailField label="LOI (Minutes)" value={project.loiMinutes} />
          <DetailField label="IR (%)" value={project.irPercent} />
          <DetailField label="Sample Size" value={project.sampleSize} />
          <DetailField label="CPI (USD)" value={project.cpiUsd} />
          <DetailField label="Start Date" value={project.startDate} />
          <DetailField label="End Date" value={project.endDate} />
        </DetailGrid>
      </TableCard>

      <SectionDivider />

      <TableCard title="Survey Links" isDarkMode={isDarkMode}>
        <DetailGrid columns={1}>
          <DetailField label="Live Link" value={<ReadOnlyUrl url={project.liveLink} />} />
          <DetailField label="Test Link" value={<ReadOnlyUrl url={project.testLink} />} />
        </DetailGrid>
      </TableCard>

      <SectionDivider />

      <TableCard title="Project Filters" isDarkMode={isDarkMode}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterCheckbox label="Geolocation" checked={project.filters.geolocation} isDarkMode={isDarkMode} />
          <FilterCheckbox label="URL Protection" checked={project.filters.urlProtection} isDarkMode={isDarkMode} />
          <FilterCheckbox label="Unique IP" checked={project.filters.uniqueIp} isDarkMode={isDarkMode} />
          <FilterCheckbox label="Prescreen" checked={project.filters.prescreen} isDarkMode={isDarkMode} />
        </div>
      </TableCard>

      <SectionDivider />

      <SurveyDataTable
        title="Supplier Mapped (Live Link)"
        columns={liveColumns}
        rows={liveRows}
        renderCell={renderMappedCell}
        isDarkMode={isDarkMode}
      />

      <div className="mt-6" />

      <SurveyDataTable
        title="Supplier Mapped (Test Link)"
        columns={testColumns}
        rows={testRows}
        renderCell={renderMappedCell}
        isDarkMode={isDarkMode}
      />

      <SectionDivider />

      <SurveyDataTable
        title="Supplier Links"
        columns={linkColumns}
        rows={linkRows}
        renderCell={renderLinkCell}
        isDarkMode={isDarkMode}
      />

      <SectionDivider />

      <TableCard title="Redirect Links For Client" isDarkMode={isDarkMode}>
        <DetailGrid columns={1}>
          <DetailField
            label="Complete Status"
            value={<ReadOnlyUrl url={project.redirectLinks.complete} />}
          />
          <DetailField
            label="Terminate Status"
            value={<ReadOnlyUrl url={project.redirectLinks.terminate} />}
          />
          <DetailField
            label="Over Quota Status"
            value={<ReadOnlyUrl url={project.redirectLinks.overQuota} />}
          />
          <DetailField
            label="Quality Term Status"
            value={<ReadOnlyUrl url={project.redirectLinks.qualityTerm} />}
          />
          <DetailField
            label="Survey Close Status"
            value={<ReadOnlyUrl url={project.redirectLinks.surveyClose} />}
          />
        </DetailGrid>
      </TableCard>

      <SectionDivider />

      <TableCard title="Note" isDarkMode={isDarkMode}>
        <p className="admin-text whitespace-pre-wrap text-sm leading-relaxed">{project.note}</p>
      </TableCard>
    </div>
  );
}

export default ProjectDetailsTab;
