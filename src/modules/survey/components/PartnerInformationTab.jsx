import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import StatusToggle from "../../../components/admin/StatusToggle";
import TableCard from "../../../components/admin/TableCard";
import { toastApiError } from "../../../services/toast/apiToast";
import {
  listPartnerMappingsForProject,
  mapSupplierMappingToDetail,
  mapSupplierMappingToRow,
} from "../services/supplierMappingApi";
import ProjectDetailsTab from "./ProjectDetailsTab";
import {
  DetailField,
  DetailGrid,
  ReadOnlyUrl,
  SectionDivider,
} from "./surveyDetailsShared";

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "";
  return value;
}

function MappingDetailSection({ detail, fallback = {}, index, total }) {
  const mappingCode = displayValue(detail.mappingCode ?? fallback.mappingCode);
  const partnerName = displayValue(
    detail.partnerName ?? fallback.partnerName ?? fallback.partnerCode
  );
  const projectId = displayValue(detail.projectId ?? fallback.projectId);
  const projectCode = displayValue(detail.projectCode ?? fallback.projectCode);
  const projectUrlId = displayValue(detail.projectUrlId ?? fallback.projectUrlId);
  const projectUrlCode = displayValue(
    detail.projectUrlCode ?? fallback.projectUrlCode
  );
  const quota = displayValue(detail.quota ?? fallback.quota);
  const cpi = displayValue(detail.cpi ?? fallback.cpi);
  const partnerUrl = String(detail.partnerUrl ?? fallback.partnerUrl ?? "").trim();
  const statusActive = Boolean(detail.statusActive ?? fallback.statusActive);
  const isTest = Boolean(detail.isTest ?? fallback.isTest);
  const linksToAssign = displayValue(detail.linksToAssign ?? fallback.linksToAssign);
  const title =
    total > 1 ? `Partner Mapping Information (${index + 1})` : "Partner Mapping Information";

  return (
    <TableCard title={title}>
      <DetailGrid columns={1}>
        <DetailField label="Mapping Code" value={mappingCode || "—"} />
        <DetailField label="Partner Name" value={partnerName || "—"} />
        <DetailField label="Project ID" value={projectId || "—"} />
        <DetailField
          label="Project Code"
          value={projectCode || "—"}
          copySuccessMessage={projectCode ? "Project Code copied" : undefined}
          copyLabel="Copy Project Code"
        />
        <DetailField label="Project URL ID" value={projectUrlId || "—"} />
        <DetailField
          label="Project URL Code"
          value={projectUrlCode || "—"}
          copySuccessMessage={projectUrlCode ? "Project URL Code copied" : undefined}
          copyLabel="Copy Project URL Code"
        />
        <DetailField label="Partner Quota" value={quota || "—"} />
        <DetailField label="CPI" value={cpi || "—"} />
        {linksToAssign ? (
          <DetailField label="Links To Assign" value={linksToAssign} />
        ) : null}
        <DetailField
          label="Status"
          value={<StatusToggle checked={statusActive} readOnly compact />}
        />
        <DetailField
          label="Is Test"
          value={
            <StatusToggle
              checked={isTest}
              readOnly
              compact
              labelOn="Test"
              labelOff="Live"
            />
          }
        />
        <DetailField
          label="Partner URL"
          copyValue={partnerUrl}
          copySuccessMessage="Partner URL copied"
          copyLabel="Copy Partner URL"
          value={partnerUrl ? <ReadOnlyUrl url={partnerUrl} /> : "—"}
        />
        {detail.complete ? (
          <DetailField label="Complete URL" value={detail.complete} />
        ) : null}
        {detail.terminate ? (
          <DetailField label="Terminate URL" value={detail.terminate} />
        ) : null}
        {detail.overQuota ? (
          <DetailField label="Over Quota URL" value={detail.overQuota} />
        ) : null}
        {detail.qualityTerm ? (
          <DetailField label="Quality Term URL" value={detail.qualityTerm} />
        ) : null}
        {detail.surveyClose ? (
          <DetailField label="Survey Close URL" value={detail.surveyClose} />
        ) : null}
      </DetailGrid>
    </TableCard>
  );
}

function PartnerInformationTab({ project, projectId }) {
  const resolvedProjectId = String(project?.recordId ?? projectId ?? "").trim();
  const [mappings, setMappings] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(resolvedProjectId));

  useEffect(() => {
    let cancelled = false;
    if (!resolvedProjectId) {
      setMappings([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    listPartnerMappingsForProject(resolvedProjectId)
      .then((records) => {
        const rows = Array.isArray(records) ? records : [];
        const details = rows.map((record, index) => {
          const mappedRow = mapSupplierMappingToRow(record, index);
          const detail = mapSupplierMappingToDetail(record) ?? {};
          return { detail, row: mappedRow };
        });
        if (!cancelled) setMappings(details);
      })
      .catch((error) => {
        if (cancelled) return;
        toastApiError(error);
        setMappings([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedProjectId]);

  return (
    <div className="space-y-0">
      <ProjectDetailsTab project={project} />
      <SectionDivider />
      {isLoading ? (
        <TableCard title="Partner Mapping Information">
          <div className="admin-text flex items-center gap-2 py-6 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading mapping details...
          </div>
        </TableCard>
      ) : mappings.length === 0 ? (
        <TableCard title="Partner Mapping Information">
          <p className="admin-text-muted py-6 text-sm">
            No partner mapping found for this project.
          </p>
        </TableCard>
      ) : (
        <div className="space-y-6">
          {mappings.map((item, index) => (
            <MappingDetailSection
              key={item.row.id || `${resolvedProjectId}-${index}`}
              detail={item.detail}
              fallback={{
                ...item.row,
                projectId: item.row.projectId || resolvedProjectId,
                projectCode: item.row.projectCode || project?.projectCode,
              }}
              index={index}
              total={mappings.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PartnerInformationTab;
