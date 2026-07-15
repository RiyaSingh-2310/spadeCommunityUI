import { useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { useModulePermission } from "../../permissions/useModulePermission";
import {
  getSupplierLinksRows,
  getSupplierMappedLiveRows,
  getSupplierMappedTestRows,
  getSupplierMappingRows,
} from "../data/surveyDetailsData";
import {
  ReadOnlyUrl,
  SectionDivider,
  StatusBadge,
  SurveyDataTable,
  TruncatedUrl,
} from "./surveyDetailsShared";
import SupplierMappingEditModal from "./SupplierMappingEditModal";
import SupplierMappingViewModal from "./SupplierMappingViewModal";

function SupplierMappingTab({ surveyId, isDarkMode }) {
  const { canWrite } = useModulePermission("survey");
  const [rows, setRows] = useState(() => getSupplierMappingRows());
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const liveRows = getSupplierMappedLiveRows();
  const testRows = getSupplierMappedTestRows();
  const linkRows = getSupplierLinksRows();

  const columns = [
    "S No",
    "Supplier Code",
    "Supplier Name",
    "Quota",
    "CPI",
    "Supplier URL",
    "Status",
    "Action",
  ];

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

  const renderCell = (row, col) => {
    if (col === "Supplier URL") {
      return <TruncatedUrl url={row.supplierUrl} maxWidthClass="max-w-[180px] sm:max-w-[240px]" />;
    }
    if (col === "Status") {
      return <StatusBadge status={row.status} />;
    }
    if (col === "Action") {
      return (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() =>
              setViewTarget({
                supplierCode: row.supplierCode,
                supplierName: row.supplierName,
              })
            }
            className="admin-icon-btn admin-text-subtle inline-flex h-8 w-8 items-center justify-center rounded-lg"
            aria-label={`View ${row.supplierName}`}
            title="View"
          >
            <Eye size={16} />
          </button>
          {canWrite && (
            <button
              type="button"
              onClick={() => setEditTarget({ supplierCode: row.supplierCode })}
              className="admin-icon-btn admin-text-subtle inline-flex h-8 w-8 items-center justify-center rounded-lg"
              aria-label={`Edit ${row.supplierName}`}
              title="Edit"
            >
              <Pencil size={16} />
            </button>
          )}
        </div>
      );
    }
    const map = {
      "S No": row.sno,
      "Supplier Code": row.supplierCode,
      "Supplier Name": row.supplierName,
      Quota: row.quota,
      CPI: row.cpi,
    };
    return map[col] ?? "—";
  };

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

  const handleUpdated = () => {
    setRows(getSupplierMappingRows());
  };

  return (
    <>
      <SurveyDataTable
        title="Supplier Mapping"
        columns={columns}
        rows={rows}
        renderCell={renderCell}
        isDarkMode={isDarkMode}
      />

      <SectionDivider />

      <SurveyDataTable
        title="Supplier Mapped Live Link"
        columns={liveColumns}
        rows={liveRows}
        renderCell={renderMappedCell}
        isDarkMode={isDarkMode}
      />

      <div className="mt-6" />

      <SurveyDataTable
        title="Supplier Mapped Test Link"
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

      <SupplierMappingViewModal
        isOpen={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        surveyId={surveyId}
        supplierCode={viewTarget?.supplierCode}
        supplierName={viewTarget?.supplierName}
      />

      <SupplierMappingEditModal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        surveyId={surveyId}
        supplierCode={editTarget?.supplierCode}
        onUpdated={handleUpdated}
      />
    </>
  );
}

export default SupplierMappingTab;
