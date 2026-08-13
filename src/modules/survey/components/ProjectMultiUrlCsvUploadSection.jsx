import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, Upload, X } from "lucide-react";
import FormField from "../../../components/admin/FormField";
import TableCard from "../../../components/admin/TableCard";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { ApiError } from "../../../services/api/ApiError";
import {
  toastApiError,
  toastApiSuccess,
  toastApiWarning,
} from "../../../services/toast/apiToast";
import {
  downloadProjectMultiUrlCsvTemplate,
  listProjectMultiUrls,
  PROJECT_MULTI_URL_COLUMNS,
  uploadProjectMultiUrlCsv,
} from "../services/projectMultiUrlApi";
import {
  countValidMultiLinkCsvFiles,
  SAMPLE_SIZE_CSV_MISMATCH_MESSAGE,
} from "../utils/multiLinkCsvCount";
import {
  primaryBtnClass,
  secondaryBtnClass,
  SectionDivider,
  StatusBadge,
  SurveyDataTable,
} from "./surveyDetailsShared";

const SELECTED_FILES_PREVIEW_LIMIT = 3;

function isCsvFile(file) {
  if (!file) return false;
  const name = String(file.name ?? "").toLowerCase();
  return (
    name.endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel"
  );
}

function getFileKey(file) {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

function renderMultiUrlCell(row, col) {
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
}

function ProjectMultiUrlCsvUploadSection({
  projectId,
  projectUrlId = "",
  isDarkMode,
  canWrite = false,
  showContextFields = true,
  showUploadControls = true,
  showRecordsTable = true,
  deferUpload = false,
  embedded = false,
  selectedFiles: controlledSelectedFiles,
  onSelectedFilesChange,
  sampleSize = "",
  title = "Upload Multi URLs",
  onBeforeUpload,
  required = false,
  error = "",
}) {
  const inputClass = getAdminInputClass();
  const fileInputRef = useRef(null);
  const resolvedProjectId = String(projectId ?? "").trim();
  const resolvedProjectUrlId = String(projectUrlId ?? "").trim();

  const [rows, setRows] = useState([]);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [internalSelectedFiles, setInternalSelectedFiles] = useState([]);
  const selectedFiles = controlledSelectedFiles ?? internalSelectedFiles;
  const setSelectedFiles = onSelectedFilesChange ?? setInternalSelectedFiles;

  const selectedSummary = useMemo(() => {
    if (selectedFiles.length === 0) return "";
    if (selectedFiles.length === 1) return selectedFiles[0].name;
    return `${selectedFiles.length} files selected`;
  }, [selectedFiles]);

  const previewFiles = selectedFiles.slice(0, SELECTED_FILES_PREVIEW_LIMIT);
  const hiddenFileCount = Math.max(0, selectedFiles.length - SELECTED_FILES_PREVIEW_LIMIT);

  const refreshRows = async () => {
    if (!resolvedProjectId) {
      setRows([]);
      return;
    }
    const response = await listProjectMultiUrls(resolvedProjectId, resolvedProjectUrlId);
    setRows(Array.isArray(response?.data) ? response.data : []);
  };

  const shouldLoadRows = showRecordsTable && Boolean(resolvedProjectId);

  useEffect(() => {
    if (!shouldLoadRows) return undefined;

    let cancelled = false;

    const load = async () => {
      setIsLoadingRows(true);
      try {
        const response = await listProjectMultiUrls(
          resolvedProjectId,
          resolvedProjectUrlId
        );
        if (cancelled) return;
        setRows(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        if (!cancelled) {
          toastApiError(error);
          setRows([]);
        }
      } finally {
        if (!cancelled) setIsLoadingRows(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [shouldLoadRows, resolvedProjectId, resolvedProjectUrlId]);

  const clearFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFilesSelected = (event) => {
    const picked = Array.from(event.target.files ?? []);
    clearFileInput();
    if (picked.length === 0) return;

    const invalid = picked.filter((file) => !isCsvFile(file));
    const valid = picked.filter((file) => isCsvFile(file));

    if (invalid.length > 0) {
      const names = invalid.map((file) => file.name).join(", ");
      toastApiError(
        new ApiError(
          invalid.length === 1
            ? `"${names}" is not a CSV file. Only .csv files are allowed.`
            : `${invalid.length} file(s) were skipped (only .csv allowed): ${names}`
        )
      );
    }

    if (valid.length === 0) return;

    setSelectedFiles((prev) => {
      const existingKeys = new Set(prev.map(getFileKey));
      const next = [...prev];
      for (const file of valid) {
        const key = getFileKey(file);
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);
        next.push(file);
      }
      return next;
    });
  };

  const handleRemoveFile = (fileKey) => {
    setSelectedFiles((prev) => prev.filter((file) => getFileKey(file) !== fileKey));
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
    clearFileInput();
  };

  const handleUpload = async () => {
    if (!canWrite || selectedFiles.length === 0 || !resolvedProjectUrlId) return;

    setIsUploading(true);
    const successes = [];
    const failures = [];

    try {
      // Match backend: Sample Size must equal valid CSV link count.
      const linksCount = await countValidMultiLinkCsvFiles(selectedFiles);
      const sampleSizeNum = Number(sampleSize);
      if (
        !Number.isFinite(sampleSizeNum) ||
        sampleSizeNum !== linksCount
      ) {
        toastApiError(
          new ApiError(SAMPLE_SIZE_CSV_MISMATCH_MESSAGE, {
            sampleSize: Number.isFinite(sampleSizeNum) ? sampleSizeNum : null,
            linksCount,
          })
        );
        return;
      }

      if (typeof onBeforeUpload === "function") {
        await onBeforeUpload();
      }

      for (const file of selectedFiles) {
        try {
          const data = await uploadProjectMultiUrlCsv({
            projectId: resolvedProjectId,
            projectUrlId: resolvedProjectUrlId,
            file,
          });
          successes.push({
            name: file.name,
            message: data?.message || "Uploaded successfully.",
          });
        } catch (error) {
          failures.push({
            name: file.name,
            message:
              error instanceof ApiError
                ? error.message
                : error?.message || "Upload failed.",
          });
        }
      }

      if (successes.length > 0 && showRecordsTable) {
        try {
          await refreshRows();
        } catch (error) {
          toastApiError(error);
        }
      }

      if (failures.length === 0) {
        toastApiSuccess({
          message:
            successes.length === 1
              ? successes[0].message || "1 CSV file uploaded successfully."
              : `${successes.length} CSV file(s) uploaded successfully.`,
        });
        setSelectedFiles([]);
        clearFileInput();
        return;
      }

      if (successes.length === 0) {
        toastApiError(
          new ApiError(
            failures.length === 1
              ? `${failures[0].name}: ${failures[0].message}`
              : `All ${failures.length} file(s) failed to upload. ${failures[0].name}: ${failures[0].message}`
          )
        );
        return;
      }

      toastApiWarning({
        message: `${successes.length} of ${selectedFiles.length} file(s) uploaded. ${failures.length} failed.`,
      });
      failures.slice(0, 3).forEach((failure) => {
        toastApiError(new ApiError(`${failure.name}: ${failure.message}`));
      });

      const failedNames = new Set(failures.map((item) => item.name));
      setSelectedFiles((prev) => prev.filter((file) => failedNames.has(file.name)));
      clearFileInput();
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    if (isDownloadingTemplate) return;
    setIsDownloadingTemplate(true);
    try {
      await downloadProjectMultiUrlCsvTemplate();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const uploadControls = (
    <div className="space-y-4">
      {showContextFields ? (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Project ID">
            <input
              className={inputClass}
              value={resolvedProjectId || "—"}
              readOnly
              disabled
            />
          </FormField>
          <FormField label="Project URL ID">
            <input
              className={inputClass}
              value={resolvedProjectUrlId || "—"}
              readOnly
              disabled
            />
          </FormField>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
        <FormField
          label="Upload CSV"
          required={required}
          // error={error}
        >
          <input
            className={inputClass}
            value={selectedSummary}
            placeholder="No file selected"
            readOnly
            disabled
            aria-invalid={Boolean(error)}
          />
        </FormField>
        <button
          type="button"
          className={secondaryBtnClass}
          disabled={!canWrite || isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          Browse Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          className="hidden"
          disabled={!canWrite || isUploading}
          onChange={handleFilesSelected}
        />
        <button
          type="button"
          className={`${secondaryBtnClass} inline-flex items-center justify-center gap-2`}
          onClick={handleDownloadTemplate}
          disabled={isDownloadingTemplate || isUploading}
        >
          {isDownloadingTemplate ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {isDownloadingTemplate ? "Downloading..." : "Download CSV Template"}
        </button>
        {!deferUpload ? (
          <button
            type="button"
            disabled={
              !canWrite ||
              selectedFiles.length === 0 ||
              isUploading ||
              !resolvedProjectUrlId
            }
            onClick={handleUpload}
            className={`${primaryBtnClass} inline-flex min-w-[120px] items-center justify-center gap-2`}
          >
            {isUploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        ) : null}
      </div>

      {selectedFiles.length > 0 ? (
        <div className="rounded-xl border border-[var(--admin-input-border)] bg-[var(--admin-input-bg)] px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="admin-text text-sm font-semibold">
              Selected Files ({selectedFiles.length})
            </p>
            <button
              type="button"
              className="admin-text-muted text-xs font-semibold transition hover:text-[var(--admin-danger-text)] disabled:opacity-50"
              onClick={handleClearFiles}
              disabled={isUploading}
            >
              Clear all
            </button>
          </div>
          <ul className="space-y-1.5">
            {previewFiles.map((file) => {
              const key = getFileKey(file);
              return (
                <li
                  key={key}
                  className="admin-text flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate" title={file.name}>
                    {file.name}
                  </span>
                  <button
                    type="button"
                    className="admin-text-subtle inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition hover:bg-[var(--admin-permissions-row-hover)] hover:text-[var(--admin-danger-text)] disabled:opacity-50"
                    onClick={() => handleRemoveFile(key)}
                    disabled={isUploading}
                    aria-label={`Remove ${file.name}`}
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
          {hiddenFileCount > 0 ? (
            <p className="admin-text-muted mt-2 text-xs font-medium">
              ...
              <br />+{hiddenFileCount} more
            </p>
          ) : null}
        </div>
      ) : null}

      {deferUpload ? (
        <p className="admin-text-muted text-sm">
          Selected CSV files will be uploaded when you save the Project URL.
        </p>
      ) : !resolvedProjectUrlId ? (
        <p className="admin-text-muted text-sm">
          Save the Project URL first to obtain a Project URL ID before uploading.
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-0">
      {showUploadControls ? (
        embedded ? (
          uploadControls
        ) : (
          <TableCard title={title} isDarkMode={isDarkMode}>
            {uploadControls}
          </TableCard>
        )
      ) : null}

      {showRecordsTable && shouldLoadRows ? (
        <>
          {!embedded ? <SectionDivider /> : <div className="mt-5" />}
          {isLoadingRows ? (
            <div className="admin-text flex items-center gap-2 text-sm">
              <Loader2 size={16} className="animate-spin" />
              Loading multi URL records...
            </div>
          ) : rows.length === 0 ? (
            embedded ? (
              <p className="admin-text-muted text-sm">No multi URL records yet.</p>
            ) : (
              <TableCard title="Project Multi URL Records" isDarkMode={isDarkMode}>
                <p className="admin-text-muted text-sm">No multi URL records yet.</p>
              </TableCard>
            )
          ) : (
            <SurveyDataTable
              title="Project Multi URL Records"
              columns={PROJECT_MULTI_URL_COLUMNS}
              rows={rows}
              renderCell={renderMultiUrlCell}
              isDarkMode={isDarkMode}
            />
          )}
        </>
      ) : null}
    </div>
  );
}

export default ProjectMultiUrlCsvUploadSection;
