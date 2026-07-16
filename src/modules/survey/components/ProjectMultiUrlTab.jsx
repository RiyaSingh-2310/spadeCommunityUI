import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import FormField from "../../../components/admin/FormField";
import TableCard from "../../../components/admin/TableCard";
import { useModulePermission } from "../../permissions/useModulePermission";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  downloadProjectMultiUrlCsvTemplate,
  listProjectMultiUrls,
  PROJECT_MULTI_URL_COLUMNS,
  uploadProjectMultiUrlCsv,
} from "../services/projectMultiUrlApi";
import {
  primaryBtnClass,
  secondaryBtnClass,
  SectionDivider,
  StatusBadge,
  SurveyDataTable,
} from "./surveyDetailsShared";

function resolveProjectUrlId(project, overrideId = "") {
  if (overrideId != null && String(overrideId).trim() !== "") {
    return String(overrideId).trim();
  }
  const urlInfo = Array.isArray(project?.urlInfo) ? project.urlInfo : [];
  const primary = urlInfo[0];
  if (!primary || typeof primary !== "object") return "";
  const value =
    primary.id ??
    primary.url_id ??
    primary.project_url_id ??
    primary.Url_Id ??
    "";
  return value != null && value !== "" ? String(value) : "";
}

function ProjectMultiUrlTab({ project, projectUrlId: projectUrlIdProp = "", isDarkMode }) {
  const { canWrite } = useModulePermission("survey");
  const inputClass = getAdminInputClass();
  const fileInputRef = useRef(null);

  const projectId = project?.recordId ?? project?.id ?? "";
  const projectUrlId = resolveProjectUrlId(project, projectUrlIdProp);

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!projectId) {
        setRows([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await listProjectMultiUrls(projectId, projectUrlId);
        if (cancelled) return;
        setRows(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        if (!cancelled) {
          toastApiError(error);
          setRows([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, projectUrlId]);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!canWrite || !selectedFile) return;

    setIsUploading(true);
    try {
      const data = await uploadProjectMultiUrlCsv({
        projectId,
        projectUrlId,
        file: selectedFile,
      });
      toastApiSuccess(data);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      const refreshed = await listProjectMultiUrls(projectId, projectUrlId);
      setRows(Array.isArray(refreshed?.data) ? refreshed.data : []);
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsUploading(false);
    }
  };

  const renderCell = (row, col) => {
    switch (col) {
      case "ID":
        return row.id || "—";
      case "Project ID":
        return row.projectId || "—";
      case "Project URL ID":
        return row.projectUrlId || "—";
      case "Live Link":
        return row.liveLink ? (
          <a
            href={row.liveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-[var(--admin-success-text)] hover:underline"
          >
            {row.liveLink}
          </a>
        ) : (
          "—"
        );
      case "Vendor URL":
        return row.vendorUrl || "—";
      case "Vendor ID":
        return row.vendorId || "—";
      case "User ID":
        return row.userId || "—";
      case "User Type":
        return row.userType || "—";
      case "Status":
        return <StatusBadge status={row.status || "Active"} />;
      default:
        return "—";
    }
  };

  return (
    <div className="space-y-0">
      <TableCard title="Upload Multi URLs" isDarkMode={isDarkMode}>
        <form className="space-y-4" onSubmit={handleUpload} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Project ID">
              <input className={inputClass} value={projectId || "—"} readOnly disabled />
            </FormField>
            <FormField label="Project URL ID">
              <input
                className={inputClass}
                value={projectUrlId || "—"}
                readOnly
                disabled
              />
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
            <FormField label="Upload URL">
              <input
                className={inputClass}
                value={selectedFile?.name ?? ""}
                placeholder="No file selected"
                readOnly
                disabled
              />
            </FormField>
            <button
              type="button"
              className={secondaryBtnClass}
              disabled={!canWrite || isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Browse File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={!canWrite || isUploading}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
              }}
            />
            <button
              type="button"
              className={`${secondaryBtnClass} inline-flex items-center justify-center gap-2`}
              onClick={downloadProjectMultiUrlCsvTemplate}
            >
              <Download size={16} />
              Download CSV Template
            </button>
            <button
              type="submit"
              disabled={!canWrite || !selectedFile || isUploading || !projectUrlId}
              className={`${primaryBtnClass} inline-flex min-w-[120px] items-center justify-center gap-2`}
            >
              {isUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>

          {!projectUrlId ? (
            <p className="admin-text-muted text-sm">
              Save the Project URL first to obtain a Project URL ID before uploading.
            </p>
          ) : null}
        </form>
      </TableCard>

      {/* Temporarily hidden — Project Multi-URL Records
      <SectionDivider />

      {isLoading ? (
        <div className="admin-text flex items-center gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading multi URL records...
        </div>
      ) : rows.length === 0 ? (
        <TableCard title="Project Multi URL Records" isDarkMode={isDarkMode}>
          <p className="admin-text-muted text-sm">No multi URL records yet.</p>
        </TableCard>
      ) : (
        <SurveyDataTable
          title="Project Multi URL Records"
          columns={PROJECT_MULTI_URL_COLUMNS}
          rows={rows}
          renderCell={renderCell}
          isDarkMode={isDarkMode}
        />
      )}
      */}
    </div>
  );
}

export default ProjectMultiUrlTab;
