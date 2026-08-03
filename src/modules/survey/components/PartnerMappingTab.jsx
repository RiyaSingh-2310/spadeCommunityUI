import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FormField from "../../../components/admin/FormField";
import NumericInput from "../../../components/admin/NumericInput";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import StatusToggle from "../../../components/admin/StatusToggle";
import TableCard from "../../../components/admin/TableCard";
import { getRecords as getPartnerRecords } from "../../../services/partners/partnersApi";
import { useModulePermission } from "../../permissions/useModulePermission";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { MAX_API_LIST_LIMIT } from "../../shared/utils/listQueryParams";
import { getOptionalUrlError, isFormValid } from "../../shared/utils/validation";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { mapPartnersToSelectOptions } from "../services/surveyApi";
import {
  buildSupplierMappingApiPayload,
  appendIsTestToPartnerUrl,
  createSupplierMapping,
  listSupplierMappings,
  mapSupplierMappingToForm,
  mapSupplierMappingToRow,
  updateSupplierMappingRecord,
  updateSupplierMappingStatus,
  updateSupplierMappingTestMode,
} from "../services/supplierMappingApi";
import { listProjectMultiUrls } from "../services/projectMultiUrlApi";
import PartnerMappingViewModal from "./PartnerMappingViewModal";
import {
  primaryBtnClass,
  secondaryBtnClass,
  SurveyDataTable,
  TruncatedUrl,
} from "./surveyDetailsShared";

const TABLE_COLUMNS = [
  "#",
  "Partner Code",
  "Quota",
  "CPI",
  "Partner URL",
  "Status",
  "Is Test?",
  "Action",
];

const REDIRECT_FIELDS = [
  {
    key: "complete",
    label: "Complete",
    example: "https://www.google.com?uid={identifier}",
  },
  {
    key: "terminate",
    label: "Terminate",
    example: "https://www.google.com?uid={identifier}",
  },
  {
    key: "overQuota",
    label: "Over Quota",
    example: "https://www.google.com?uid={identifier}",
  },
  {
    key: "qualityTerm",
    label: "Quality Term",
    example: "https://www.google.com?uid={identifier}",
  },
  {
    key: "surveyClose",
    label: "Survey Close",
    example: "https://www.google.com?uid={identifier}",
  },
  {
    key: "postbackUrl",
    label: "Post Back Url",
    example: "https://www.google.com?uid={identifier}",
  },
];

const REDIRECT_FIELD_KEYS = REDIRECT_FIELDS.map((field) => field.key);

function createEmptyPartnerForm() {
  return {
    mappingId: "",
    partnerId: "",
    partnerCode: "",
    quota: "",
    cpi: "",
    linksToAssign: "",
    statusActive: true,
    isTest: false,
    redirects: {
      complete: "",
      terminate: "",
      overQuota: "",
      qualityTerm: "",
      surveyClose: "",
      postbackUrl: "",
    },
  };
}

function sumAssignedMultiLinks(rows = []) {
  return rows.reduce((total, row) => {
    const value = Number(String(row?.linksToAssign ?? "").trim());
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
}

function PartnerMappingTab({
  projectId,
  projectUrlId,
  projectLinkType = "",
  isDarkMode,
  readOnly = false,
}) {
  const { canWrite } = useModulePermission("survey");
  const allowWrite = canWrite && !readOnly;
  const inputClass = getAdminInputClass();
  const navigate = useNavigate();
  const resolvedProjectUrlId = String(projectUrlId ?? "").trim();
  const isMultiLink = String(projectLinkType ?? "")
    .toLowerCase()
    .includes("multi");

  const [rows, setRows] = useState([]);
  const [multiLinkTotal, setMultiLinkTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [form, setForm] = useState(createEmptyPartnerForm);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partnerOptionsSource, setPartnerOptionsSource] = useState([]);
  const [viewTarget, setViewTarget] = useState(null);
  const [togglingRowId, setTogglingRowId] = useState("");

  const loadMappings = useCallback(async () => {
    if (!projectId || !resolvedProjectUrlId) {
      setRows([]);
      return;
    }

    setIsLoading(true);
    try {
      const records = await listSupplierMappings({
        projectId,
        projectUrlId: resolvedProjectUrlId,
      });
      const nextRows = Array.isArray(records)
        ? records.map((record, index) => mapSupplierMappingToRow(record, index))
        : [];
      setRows(nextRows);

      if (isMultiLink) {
        try {
          const multiUrlResponse = await listProjectMultiUrls(
            projectId,
            resolvedProjectUrlId
          );
          const multiRows = Array.isArray(multiUrlResponse?.data)
            ? multiUrlResponse.data
            : [];
          setMultiLinkTotal(multiRows.length);
        } catch {
          setMultiLinkTotal(0);
        }
      } else {
        setMultiLinkTotal(0);
      }
    } catch (error) {
      toastApiError(error);
      setRows([]);
      setMultiLinkTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, resolvedProjectUrlId, isMultiLink]);

  useEffect(() => {
    loadMappings();
  }, [loadMappings]);

  const assignedPartnerIds = useMemo(
    () =>
      new Set(
        rows.map((row) => String(row.partnerId ?? "").trim()).filter(Boolean)
      ),
    [rows]
  );

  const loadPartnerOptions = useCallback(async () => {
    try {
      const response = await getPartnerRecords({
        page: 1,
        limit: MAX_API_LIST_LIMIT,
      });
      const items = Array.isArray(response?.items) ? response.items : [];
      setPartnerOptionsSource(
        items.map((partner) => ({
          partner_id: partner.id,
          code: partner.partnerCode,
          name: partner.name,
        }))
      );
      return items;
    } catch (error) {
      toastApiError(error);
      setPartnerOptionsSource([]);
      return [];
    }
  }, []);

  const partnerOptions = useMemo(() => {
    const options = mapPartnersToSelectOptions(partnerOptionsSource);
    if (formMode === "edit" && form.partnerId) {
      const exists = options.some((option) => option.value === form.partnerId);
      if (!exists) {
        const label = [form.partnerCode, rows.find((r) => r.partnerId === form.partnerId)?.partnerName]
          .filter(Boolean)
          .join(" — ");
        return [{ value: form.partnerId, label: label || form.partnerCode }, ...options];
      }
    }
    return options;
  }, [partnerOptionsSource, formMode, form.partnerId, form.partnerCode, rows]);

  const addPartnerOptions = useMemo(
    () =>
      partnerOptions.filter(
        (option) => !assignedPartnerIds.has(String(option.value))
      ),
    [partnerOptions, assignedPartnerIds]
  );

  const leftMultiLinkCount = useMemo(() => {
    if (!isMultiLink) return 0;
    return Math.max(0, multiLinkTotal - sumAssignedMultiLinks(rows));
  }, [isMultiLink, multiLinkTotal, rows]);

  const tableColumns = useMemo(() => {
    const columns = [...TABLE_COLUMNS];
    if (isMultiLink) {
      const cpiIndex = columns.indexOf("CPI");
      if (cpiIndex >= 0) {
        columns.splice(cpiIndex + 1, 0, "Links Assigned");
      }
    }
    return columns;
  }, [isMultiLink]);

  const errors = useMemo(() => {
    const next = {};
    if (!form.partnerId) next.partnerId = "Partner is required";
    if (!String(form.quota ?? "").trim()) next.quota = "Partner quota is required";
    if (!String(form.cpi ?? "").trim()) next.cpi = "CPI is required";

    if (isMultiLink) {
      const linksValue = String(form.linksToAssign ?? "").trim();
      if (!linksValue) {
        next.linksToAssign = "Number of links is required";
      } else if (!/^\d+$/.test(linksValue) || Number(linksValue) < 1) {
        next.linksToAssign = "Enter a valid number of links (minimum 1)";
      }
    }

    REDIRECT_FIELDS.forEach((field) => {
      next[field.key] = getOptionalUrlError(
        form.redirects[field.key] ?? "",
        field.label
      );
    });

    return next;
  }, [form, isMultiLink]);

  const validationFields = useMemo(() => {
    const fields = ["partnerId", "quota", "cpi", ...REDIRECT_FIELD_KEYS];
    if (isMultiLink) fields.push("linksToAssign");
    return fields;
  }, [isMultiLink]);

  const { showError, touch, validateSubmit } = useFormValidation({
    errors,
    fields: validationFields,
  });

  const resetForm = () => {
    setForm(createEmptyPartnerForm());
    setFormMode("add");
    setShowForm(false);
    setIsFormLoading(false);
  };

  const openAddForm = async () => {
    if (!allowWrite || !resolvedProjectUrlId) return;
    setShowForm(true);
    setFormMode("add");
    setForm(createEmptyPartnerForm());
    setIsFormLoading(true);
    await loadPartnerOptions();
    setIsFormLoading(false);
  };

  const openEditForm = async (row) => {
    if (!row?.id) return;

    setShowForm(true);
    setFormMode("edit");
    setIsFormLoading(true);

    try {
      await loadPartnerOptions();
      const mapped = mapSupplierMappingToForm(row.record ?? row);
      if (!mapped) {
        throw new Error("Partner mapping not found.");
      }
      setForm(mapped);
    } catch (error) {
      toastApiError(error);
      resetForm();
    } finally {
      setIsFormLoading(false);
    }
  };

  const handlePartnerChange = (partnerId) => {
    const partner = partnerOptionsSource.find(
      (item) => String(item.partner_id ?? item.id) === String(partnerId)
    );
    setForm((prev) => ({
      ...prev,
      partnerId: String(partnerId),
      partnerCode: String(partner?.code ?? "").trim(),
    }));
    touch("partnerId");
  };

  const setRedirect = (key, value) => {
    setForm((prev) => ({
      ...prev,
      redirects: { ...prev.redirects, [key]: value },
    }));
  };

  const buildPayloadFromForm = () =>
    buildSupplierMappingApiPayload({
      partnerId: form.partnerId,
      projectId,
      projectUrlId: resolvedProjectUrlId,
      quota: form.quota,
      cpi: form.cpi,
      linksToAssign: isMultiLink ? form.linksToAssign : undefined,
      redirects: form.redirects,
      statusActive: form.statusActive,
      isTest: form.isTest,
    });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!allowWrite || !resolvedProjectUrlId) return;
    if (!validateSubmit() || !isFormValid(errors)) return;

    setIsSubmitting(true);
    const isCreate = formMode === "add";
    try {
      const payload = buildPayloadFromForm();
      const data =
        formMode === "edit" && form.mappingId
          ? await updateSupplierMappingRecord(form.mappingId, payload)
          : await createSupplierMapping(payload);

      toastApiSuccess(data);

      if (isCreate) {
        navigate(0);
        return;
      }

      resetForm();
      await loadMappings();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowToggle = async (row, field) => {
    if (!allowWrite || togglingRowId || !row?.id) return;

    const nextStatusActive =
      field === "status" ? !row.statusActive : row.statusActive;
    const nextIsTest = field === "isTest" ? !row.isTest : row.isTest;
    const rowId = String(row.id);

    setTogglingRowId(rowId);
    setRows((prev) =>
      prev.map((item) =>
        String(item.id) === rowId
          ? {
              ...item,
              statusActive: nextStatusActive,
              isTest: nextIsTest,
            }
          : item
      )
    );

    try {
      if (field === "status") {
        const data = await updateSupplierMappingStatus(rowId, nextStatusActive);
        toastApiSuccess(data);
        await loadMappings();
        return;
      }

      const data = await updateSupplierMappingTestMode(rowId, nextIsTest);
      toastApiSuccess(data);
      await loadMappings();
    } catch (error) {
      toastApiError(error);
      await loadMappings();
    } finally {
      setTogglingRowId("");
    }
  };

  const renderCell = (row, col) => {
    if (col === "#") {
      return `${row.sno}.`;
    }
    if (col === "Partner URL") {
      return row.partnerUrl
        ? (
            <TruncatedUrl
              url={appendIsTestToPartnerUrl(row.partnerUrl, row.isTest)}
              maxWidthClass="max-w-[180px] sm:max-w-[280px]"
            />
          )
        : "—";
    }
    if (col === "Status") {
      const rowId = String(row.id);
      return (
        <StatusToggle
          checked={row.statusActive}
          readOnly={!allowWrite || togglingRowId === rowId}
          compact
          onChange={() => handleRowToggle(row, "status")}
        />
      );
    }
    if (col === "Is Test?") {
      const rowId = String(row.id);
      return (
        <StatusToggle
          checked={row.isTest}
          labelOn="Test"
          labelOff="Live"
          readOnly={!allowWrite || togglingRowId === rowId}
          compact
          onChange={() => handleRowToggle(row, "isTest")}
        />
      );
    }
    if (col === "Action") {
      return (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() =>
              setViewTarget({
                mappingId: row.id,
                partnerName: row.partnerName,
              })
            }
            className="admin-icon-btn admin-text-subtle inline-flex h-8 w-8 items-center justify-center rounded-lg"
            aria-label={`View ${row.partnerName}`}
            title="View"
          >
            <Eye size={16} />
          </button>
          {allowWrite ? (
            <button
              type="button"
              onClick={() => openEditForm(row)}
              className="admin-icon-btn admin-text-subtle inline-flex h-8 w-8 items-center justify-center rounded-lg"
              aria-label={`Edit ${row.partnerName}`}
              title="Edit"
            >
              <Pencil size={16} />
            </button>
          ) : null}
        </div>
      );
    }

    const map = {
      "Partner Code": row.partnerCode,
      Quota: row.quota,
      CPI: row.cpi,
      "Links Assigned": row.linksToAssign ?? "—",
    };
    return map[col] ?? "—";
  };

  const canSubmit = isFormValid(errors) && !isSubmitting && !isFormLoading;

  if (!resolvedProjectUrlId) {
    return (
      <div className="admin-text rounded-xl border border-[var(--admin-border)] p-6 text-sm">
        Save a Project URL first to enable partner mapping for this project.
      </div>
    );
  }

  return (
    <>
      {isLoading ? (
        <div className="admin-text flex min-h-[200px] items-center justify-center gap-2 text-sm">
          <Loader2 size={18} className="animate-spin" />
          Loading partner mappings...
        </div>
      ) : (
        <SurveyDataTable
          title="Partner Mapping"
          columns={tableColumns}
          rows={rows}
          renderCell={renderCell}
          isDarkMode={isDarkMode}
          footer={
            allowWrite ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={openAddForm}
                  className="text-sm font-semibold text-[var(--admin-primary-color)] transition hover:opacity-80"
                >
                  + Add Partner
                </button>
                {isMultiLink ? (
                  <span className="text-sm font-semibold text-[var(--admin-danger-text)]">
                    (Left Multi Link - {leftMultiLinkCount})
                  </span>
                ) : null}
              </div>
            ) : null
          }
        />
      )}

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-0" noValidate>
          <TableCard
            title={formMode === "edit" ? "Edit Partner" : "Add Partner"}
            isDarkMode={isDarkMode}
          >
            {isFormLoading ? (
              <div className="admin-text flex items-center gap-2 py-8 text-sm">
                <Loader2 size={16} className="animate-spin" />
                Loading partner details...
              </div>
            ) : (
              <div className="space-y-5">
                <div className={`grid gap-4 ${isMultiLink ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
                  <FormField
                    label="Partner"
                    required
                    error={showError("partnerId") ? errors.partnerId : ""}
                  >
                    <SearchableSelect
                      inputClass={inputClass}
                      value={form.partnerId}
                      onChange={handlePartnerChange}
                      options={
                        formMode === "add" ? addPartnerOptions : partnerOptions
                      }
                      placeholder="Select partner"
                      searchPlaceholder="Search partner..."
                      disabled={isSubmitting || formMode === "edit"}
                      aria-label="Partner"
                    />
                  </FormField>
                  <FormField
                    label="Partner Quota"
                    required
                    error={showError("quota") ? errors.quota : ""}
                  >
                    <input
                      className={inputClass}
                      value={form.quota}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, quota: event.target.value }))
                      }
                      onBlur={() => touch("quota")}
                      disabled={isSubmitting}
                      aria-invalid={Boolean(showError("quota") && errors.quota)}
                    />
                  </FormField>
                  <FormField
                    label="CPI"
                    required
                    error={showError("cpi") ? errors.cpi : ""}
                  >
                    <input
                      className={inputClass}
                      value={form.cpi}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, cpi: event.target.value }))
                      }
                      onBlur={() => touch("cpi")}
                      disabled={isSubmitting}
                      aria-invalid={Boolean(showError("cpi") && errors.cpi)}
                    />
                  </FormField>
                  {isMultiLink ? (
                    <FormField
                      label="Links To Assign"
                      required
                      error={showError("linksToAssign") ? errors.linksToAssign : ""}
                      hint="How many multi URLs should be assigned to this partner"
                    >
                      <NumericInput
                        className={inputClass}
                        value={form.linksToAssign}
                        onChange={(value) =>
                          setForm((prev) => ({ ...prev, linksToAssign: value }))
                        }
                        onBlur={() => touch("linksToAssign")}
                        disabled={isSubmitting}
                        placeholder="e.g. 10"
                        aria-invalid={Boolean(
                          showError("linksToAssign") && errors.linksToAssign
                        )}
                      />
                    </FormField>
                  ) : null}
                </div>

                <div>
                  <h3 className="admin-text mb-3 text-sm font-bold">
                    Partner Dynamic Redirection Link
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {REDIRECT_FIELDS.map((field) => (
                      <FormField
                        key={field.key}
                        label={field.label}
                        error={showError(field.key) ? errors[field.key] : ""}
                      >
                        <input
                          className={inputClass}
                          value={form.redirects[field.key] ?? ""}
                          onChange={(event) =>
                            setRedirect(field.key, event.target.value)
                          }
                          onBlur={() => touch(field.key)}
                          disabled={isSubmitting}
                          placeholder={field.example}
                        />
                        <p className="admin-text-subtle mt-1 text-[11px]">
                          Link eg. {field.example}
                        </p>
                      </FormField>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TableCard>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              disabled={isSubmitting}
              className={secondaryBtnClass}
            >
              Cancel
            </button>
            {allowWrite ? (
              <button
                type="submit"
                disabled={!canSubmit}
                className={`${primaryBtnClass} flex min-w-[120px] items-center justify-center gap-2`}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? "Saving..." : "Submit"}
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <PartnerMappingViewModal
        isOpen={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        mappingId={viewTarget?.mappingId}
        partnerName={viewTarget?.partnerName}
        isMultiLink={isMultiLink}
      />
    </>
  );
}

export default PartnerMappingTab;
