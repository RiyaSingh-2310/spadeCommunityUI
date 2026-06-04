import { useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { useModulePermission } from "../../permissions/useModulePermission";
import { getSupplierMappingRows } from "../data/surveyDetailsData";
import { StatusBadge, SurveyDataTable, TruncatedUrl } from "./surveyDetailsShared";
import SupplierMappingEditModal from "./SupplierMappingEditModal";
import SupplierMappingViewModal from "./SupplierMappingViewModal";

function SupplierMappingTab({ surveyId, isDarkMode }) {
  const { canWrite } = useModulePermission("survey");
  const [rows, setRows] = useState(() => getSupplierMappingRows());
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

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
