import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import AdminDatePicker from "../../../components/admin/AdminDatePicker";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import DecimalInput from "../../../components/admin/DecimalInput";
import FormField from "../../../components/admin/FormField";
import NumericInput from "../../../components/admin/NumericInput";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import TableCard from "../../../components/admin/TableCard";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { useModulePermission } from "../../permissions/useModulePermission";
import { getAdminInputClass, getAdminTextareaClass } from "../../shared/utils/formStyles";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  createEmptyProjectUrlForm,
  createProjectUrl,
  deleteProjectUrl,
  getProjectUrlFormForEdit,
  getSurveyGroupOptionsForLanguage,
  listProjectUrlsByProject,
  mapApiUrlInfoToForm,
  mapProjectUrlToForm,
  PROJECT_URL_COUNTRY_OPTIONS,
  PROJECT_URL_PRESCREEN_LANGUAGES,
  PROJECT_URL_STATUS_OPTIONS,
  updateProjectUrls,
} from "../services/projectUrlsApi";
import {
  areProjectUrlFormsEqual,
  cloneProjectUrlForm,
  getProjectUrlFormErrors,
  isProjectUrlFormValid,
  normalizeProjectUrlFormForState,
  PROJECT_URL_CPI_MAX_DECIMALS,
  PROJECT_URL_FORM_FIELDS,
  PROJECT_URL_NUMERIC_MAX_DIGITS,
  sanitizeProjectUrlDecimal,
  sanitizeProjectUrlInteger,
} from "../utils/projectUrlFormValidation";
import { PROJECT_URL_VIEW_IDS } from "../utils/surveyDetailsNavigation";
import {
  SectionDivider,
  primaryBtnClass,
  secondaryBtnClass,
} from "./surveyDetailsShared";

const PROJECT_URL_LIST_COLUMNS = ["ID", "URL", "Action"];

function InteractiveCheckbox({ label, checked, onChange, disabled }) {
  return (
    <label
      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 border-[var(--admin-input-border)] bg-[var(--admin-input-bg)] ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        className="admin-checkbox"
        checked={Boolean(checked)}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="admin-text text-sm font-medium">{label}</span>
    </label>
  );
}

function normalizeUrlRecord(row, projectFk) {
  if (!row) return createEmptyProjectUrlForm(projectFk);
  if (row.Live_Link != null || row.description != null || row["LOI(Minute)"] != null) {
    return mapApiUrlInfoToForm(row, projectFk);
  }
  return mapProjectUrlToForm({
    ...createEmptyProjectUrlForm(projectFk),
    ...row,
    projectId: row.projectId ?? projectFk,
  });
}

function toListRow(record) {
  const id = record?.id != null && record.id !== "" ? String(record.id) : "";
  const url =
    String(record?.liveLink ?? "").trim() ||
    String(record?.testLink ?? "").trim() ||
    String(record?.discussion ?? "").trim() ||
    "—";
  return {
    id,
    url,
    record,
  };
}

function trimOnBlur(value) {
  return String(value ?? "").trim();
}

function ProjectUrlsTab({
  surveyId,
  project,
  isDarkMode,
  onSaved,
  urlView = PROJECT_URL_VIEW_IDS.LIST,
  urlId = "",
  onViewChange,
}) {
  const { canWrite } = useModulePermission("survey");
  const inputClass = getAdminInputClass();
  const textareaClass = getAdminTextareaClass();
  const projectFk = project?.recordId ?? surveyId;
  const projectCode = project?.projectCode || project?.surveyId || "";
  const isMultiLink = String(project?.projectLinkType ?? "")
    .toLowerCase()
    .includes("multi");

  const view =
    urlView === PROJECT_URL_VIEW_IDS.ADD || urlView === PROJECT_URL_VIEW_IDS.EDIT
      ? "form"
      : "list";

  const [urlRecords, setUrlRecords] = useState([]);
  const [form, setForm] = useState(() => createEmptyProjectUrlForm(projectFk));
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [selectedUrlId, setSelectedUrlId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preScreenerOptions, setPreScreenerOptions] = useState([]);
  const [isLoadingPreScreeners, setIsLoadingPreScreeners] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingEditForm, setIsLoadingEditForm] = useState(false);
  const loadedEditKeyRef = useRef("");
  const editFormReadyRef = useRef(false);
  const navigateToListRef = useRef(() => {});

  const isEdit = urlView === PROJECT_URL_VIEW_IDS.EDIT;

  const errors = useMemo(() => getProjectUrlFormErrors(form), [form]);
  const { showError, touch, validateSubmit, resetValidation, isValid } =
    useFormValidation({
      errors,
      fields: PROJECT_URL_FORM_FIELDS,
    });

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const navigateToList = useCallback(() => {
    onViewChange?.({
      urlView: PROJECT_URL_VIEW_IDS.LIST,
      urlId: "",
    });
  }, [onViewChange]);

  navigateToListRef.current = navigateToList;

  const resetFormState = useCallback(() => {
    setSelectedUrlId("");
    setForm(createEmptyProjectUrlForm(projectFk));
    setInitialSnapshot(null);
    setPendingDelete(null);
    loadedEditKeyRef.current = "";
    editFormReadyRef.current = false;
    resetValidation();
  }, [projectFk, resetValidation]);

  const initAddForm = useCallback(() => {
    const nextForm = normalizeProjectUrlFormForState(
      createEmptyProjectUrlForm(projectFk)
    );
    setSelectedUrlId("");
    setForm(nextForm);
    setInitialSnapshot(cloneProjectUrlForm(nextForm));
    resetValidation();
  }, [projectFk, resetValidation]);

  // Reset local form state when switching projects.
  useEffect(() => {
    if (urlView === PROJECT_URL_VIEW_IDS.ADD) {
      initAddForm();
      return;
    }
    if (urlView === PROJECT_URL_VIEW_IDS.LIST) {
      resetFormState();
    }
  }, [projectFk]); // eslint-disable-line react-hooks/exhaustive-deps -- only on project switch

  // Initialize add/list form when the routed view changes.
  useEffect(() => {
    if (urlView === PROJECT_URL_VIEW_IDS.ADD) {
      initAddForm();
      return;
    }
    if (urlView === PROJECT_URL_VIEW_IDS.LIST) {
      resetFormState();
    }
  }, [urlView, initAddForm, resetFormState]);

  useEffect(() => {
    if (urlView !== PROJECT_URL_VIEW_IDS.EDIT) {
      loadedEditKeyRef.current = "";
      editFormReadyRef.current = false;
      setIsLoadingEditForm(false);
      return undefined;
    }
    if (!urlId) {
      navigateToListRef.current();
      return undefined;
    }

    const editKey = `${projectFk}:${urlId}`;
    if (loadedEditKeyRef.current === editKey && editFormReadyRef.current) {
      return undefined;
    }

    let cancelled = false;
    setIsLoadingEditForm(true);

    const loadEditForm = async () => {
      try {
        const cached = urlRecords.find(
          (item) => String(item.id) === String(urlId)
        );
        const nextForm = await getProjectUrlFormForEdit(projectFk, urlId, cached);
        if (cancelled) return;
        if (!nextForm) {
          navigateToListRef.current();
          return;
        }
        const normalized = normalizeProjectUrlFormForState(nextForm);
        setSelectedUrlId(normalized.id ? String(normalized.id) : String(urlId));
        setForm(normalized);
        setInitialSnapshot(cloneProjectUrlForm(normalized));
        loadedEditKeyRef.current = editKey;
        editFormReadyRef.current = true;
        resetValidation();
      } catch (error) {
        if (!cancelled) {
          toastApiError(error);
          navigateToListRef.current();
        }
      } finally {
        if (!cancelled) setIsLoadingEditForm(false);
      }
    };

    loadEditForm();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when edit target changes
  }, [urlView, urlId, projectFk]);

  const loadUrlRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await listProjectUrlsByProject(projectFk);
      const rows = Array.isArray(response?.data) ? response.data : [];
      const mapped = rows
        .map((row) => normalizeUrlRecord(row, projectFk))
        .filter(
          (row) =>
            Boolean(row.id) ||
            Boolean(String(row.liveLink ?? "").trim()) ||
            Boolean(String(row.testLink ?? "").trim()) ||
            Boolean(String(row.discussion ?? "").trim()) ||
            Boolean(String(row.loi ?? "").trim()) ||
            Boolean(String(row.country ?? "").trim())
        );
      setUrlRecords(mapped);
      return mapped;
    } catch (error) {
      toastApiError(error);
      setUrlRecords([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [projectFk]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (cancelled) return;
      await loadUrlRecords();
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [loadUrlRecords]);

  useEffect(() => {
    if (view !== "form" || isLoadingEditForm) return undefined;

    let cancelled = false;

    const loadPreScreeners = async () => {
      if (!form.language) {
        setPreScreenerOptions([]);
        return;
      }

      setIsLoadingPreScreeners(true);
      try {
        const response = await getSurveyGroupOptionsForLanguage(form.language);
        if (cancelled) return;
        const options = response?.data ?? [];
        setPreScreenerOptions(options);

        // Keep previously selected group on edit; only normalize when still present.
        setForm((prev) => {
          if (!prev.preScreenerId && !prev.surveyGroupId) return prev;
          const selectedId = String(prev.preScreenerId || prev.surveyGroupId);
          const stillValid = options.some(
            (option) => String(option.value) === selectedId
          );
          if (!stillValid) return prev;
          return {
            ...prev,
            preScreenerId: selectedId,
            surveyGroupId: selectedId,
          };
        });
      } catch {
        if (!cancelled) setPreScreenerOptions([]);
      } finally {
        if (!cancelled) setIsLoadingPreScreeners(false);
      }
    };

    loadPreScreeners();
    return () => {
      cancelled = true;
    };
  }, [form.language, view, isLoadingEditForm]);

  const listRows = useMemo(
    () => urlRecords.map((record) => toListRow(record)),
    [urlRecords]
  );

  const isDirty = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false;
    return !areProjectUrlFormsEqual(form, initialSnapshot);
  }, [isEdit, initialSnapshot, form]);

  const canSubmit =
    canWrite &&
    !isSaving &&
    (isEdit ? isDirty : isValid);

  const preScreenerPlaceholder = useMemo(() => {
    if (!form.language) return "Select language in Survey Matrix first";
    if (isLoadingPreScreeners) return "Loading pre-screener groups...";
    if (preScreenerOptions.length === 0) return "No pre-screener groups found";
    return "Select Pre-Screen Group";
  }, [form.language, isLoadingPreScreeners, preScreenerOptions.length]);

  const handleLanguageChange = (language) => {
    setForm((prev) => ({
      ...prev,
      language,
      preScreenerId: "",
      surveyGroupId: "",
    }));
    touch("preScreenerId");
  };

  const openAddForm = () => {
    onViewChange?.({
      urlView: PROJECT_URL_VIEW_IDS.ADD,
      urlId: "",
    });
  };

  const openEditForm = (row) => {
    const record =
      row?.record ?? urlRecords.find((item) => String(item.id) === String(row?.id));
    const nextForm = normalizeUrlRecord(record ?? row, projectFk);
    const nextId = String(nextForm.id || row?.id || "").trim();
    onViewChange?.({
      urlView: PROJECT_URL_VIEW_IDS.EDIT,
      urlId: nextId,
    });
  };

  const closeForm = () => {
    navigateToList();
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!canWrite) return;
    if (!validateSubmit() || !isProjectUrlFormValid(form)) return;
    if (isEdit && !isDirty) return;

    setIsSaving(true);
    try {
      const resolvedUrlId = String(
        selectedUrlId || form.id || urlId || ""
      ).trim();

      const payloadForm = {
        ...form,
        discussion: trimOnBlur(form.discussion),
        liveLink: trimOnBlur(form.liveLink),
        testLink: trimOnBlur(form.testLink),
        redirectComplete: trimOnBlur(form.redirectComplete),
        redirectTerminate: trimOnBlur(form.redirectTerminate),
        redirectOverQuota: trimOnBlur(form.redirectOverQuota),
        redirectQualityTerm: trimOnBlur(form.redirectQualityTerm),
        redirectSurveyClose: trimOnBlur(form.redirectSurveyClose),
        loi: trimOnBlur(form.loi),
        ir: trimOnBlur(form.ir),
        cpiRate: trimOnBlur(form.cpiRate),
        sampleSize: trimOnBlur(form.sampleSize),
        completeRewardPoints: trimOnBlur(form.completeRewardPoints),
        validateRewardPoints: trimOnBlur(form.validateRewardPoints),
        id: resolvedUrlId,
        projectId: form.projectId || String(projectFk ?? ""),
        surveyGroupId: form.preScreenerId || form.surveyGroupId,
        preScreenerId: form.preScreenerId || form.surveyGroupId,
        ...(isMultiLink ? { liveLink: "", testLink: "" } : {}),
      };

      const isCreate = !resolvedUrlId;
      const data = isCreate
        ? await createProjectUrl(projectFk, payloadForm)
        : await updateProjectUrls(projectFk, payloadForm, {
            project,
            urlId: resolvedUrlId,
          });

      toastApiSuccess(data);
      const savedId =
        data?.data?.id != null
          ? String(data.data.id)
          : resolvedUrlId || selectedUrlId || form.id || "";

      await loadUrlRecords();

      if (isCreate) {
        onSaved?.({
          projectId: projectFk,
          projectUrlId: savedId,
          response: data,
        });
        navigateToList();
        return;
      }

      const refreshed = await getProjectUrlFormForEdit(projectFk, savedId, payloadForm);
      if (refreshed) {
        const normalized = normalizeProjectUrlFormForState(refreshed);
        setForm(normalized);
        setInitialSnapshot(cloneProjectUrlForm(normalized));
        loadedEditKeyRef.current = `${projectFk}:${savedId}`;
        editFormReadyRef.current = true;
        resetValidation();
      }

      onSaved?.({
        projectId: projectFk,
        projectUrlId: savedId,
        response: data,
        keepEditing: true,
      });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRequest = (row) => {
    setPendingDelete(row);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete?.id) return;
    setIsDeleting(true);
    try {
      const data = await deleteProjectUrl(pendingDelete.id);
      toastApiSuccess(data);
      setPendingDelete(null);
      await loadUrlRecords();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (view === "form" && isEdit && isLoadingEditForm) {
    return (
      <div className="admin-text flex items-center gap-2 py-8 text-sm">
        <Loader2 size={16} className="animate-spin" />
        Loading Project URL...
      </div>
    );
  }

  if (view === "list") {
    return (
      <>
        <ModuleListingPage
          isDarkMode={isDarkMode}
          hidePageHeader
          title="Project URL"
          searchPlaceholder="Search Project URL..."
          actionLabel="+ Add Project URL"
          onActionClick={openAddForm}
          columns={PROJECT_URL_LIST_COLUMNS}
          rows={listRows}
          rowIdKey="id"
          actionVariant="edit-delete"
          showDeleteAction
          onEdit={openEditForm}
          onDelete={handleDeleteRequest}
          permissionModule="survey"
          isLoading={isLoading}
          emptyMessage="No Project URL records found"
          showPagination
          nowrapAllCells
        />
        <DeleteConfirmModal
          isOpen={Boolean(pendingDelete)}
          onCancel={() => {
            if (isDeleting) return;
            setPendingDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      </>
    );
  }

  return (
    <form className="space-y-0" onSubmit={handleSave} noValidate>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="admin-text text-base font-semibold">
          {isEdit ? "Edit Project URL" : "Add Project URL"}
        </h3>
        <button
          type="button"
          onClick={closeForm}
          className={secondaryBtnClass}
          disabled={isSaving}
        >
          Back to List
        </button>
      </div>

      <TableCard title="Basic Information" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Project ID">
            <input
              className={inputClass}
              value={form.projectId || String(projectFk ?? "")}
              readOnly
              disabled
            />
          </FormField>
          <FormField label="Project Code">
            <input
              className={inputClass}
              value={projectCode}
              readOnly
              disabled
            />
          </FormField>
          <FormField label="Description" className="sm:col-span-2">
            <textarea
              className={textareaClass}
              value={form.discussion}
              onChange={(event) => setField("discussion", event.target.value)}
              onBlur={(event) => setField("discussion", trimOnBlur(event.target.value))}
              placeholder="Enter description"
              rows={3}
              disabled={!canWrite}
            />
          </FormField>
        </div>
      </TableCard>

      <SectionDivider />

      <TableCard title="Survey Matrix" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            label="LOI (Minutes)"
            required
            error={showError("loi") ? errors.loi : ""}
          >
            <DecimalInput
              className={inputClass}
              value={form.loi}
              onChange={(value) =>
                setField("loi", sanitizeProjectUrlDecimal(value))
              }
              onBlur={() => touch("loi")}
              placeholder="e.g. 15"
              decimalPlaces={PROJECT_URL_CPI_MAX_DECIMALS}
              disabled={!canWrite}
              aria-invalid={Boolean(showError("loi") && errors.loi)}
            />
          </FormField>
          <FormField
            label="IR (%)"
            required
            error={showError("ir") ? errors.ir : ""}
          >
            <DecimalInput
              className={inputClass}
              value={form.ir}
              onChange={(value) =>
                setField("ir", sanitizeProjectUrlDecimal(value))
              }
              onBlur={() => touch("ir")}
              placeholder="e.g. 32"
              decimalPlaces={PROJECT_URL_CPI_MAX_DECIMALS}
              disabled={!canWrite}
              aria-invalid={Boolean(showError("ir") && errors.ir)}
            />
          </FormField>
          <FormField
            label="CPI"
            required
            error={showError("cpiRate") ? errors.cpiRate : ""}
          >
            <DecimalInput
              className={inputClass}
              value={form.cpiRate}
              onChange={(value) =>
                setField("cpiRate", sanitizeProjectUrlDecimal(value))
              }
              onBlur={() => touch("cpiRate")}
              placeholder="e.g. 10.25"
              decimalPlaces={PROJECT_URL_CPI_MAX_DECIMALS}
              disabled={!canWrite}
              aria-invalid={Boolean(showError("cpiRate") && errors.cpiRate)}
            />
          </FormField>
          <FormField
            label="Sample Size"
            required
            error={showError("sampleSize") ? errors.sampleSize : ""}
          >
            <NumericInput
              className={inputClass}
              value={form.sampleSize}
              onChange={(value) =>
                setField("sampleSize", sanitizeProjectUrlInteger(value))
              }
              onBlur={() => touch("sampleSize")}
              placeholder="e.g. 500"
              maxLength={PROJECT_URL_NUMERIC_MAX_DIGITS}
              disabled={!canWrite}
              aria-invalid={Boolean(showError("sampleSize") && errors.sampleSize)}
            />
          </FormField>
          <FormField
            label="Start Date"
            required
            error={showError("startDate") ? errors.startDate : ""}
          >
            <AdminDatePicker
              value={form.startDate}
              onChange={(value) => {
                setField("startDate", value);
                touch("startDate");
              }}
              placeholder="Select start date"
              disabled={!canWrite}
              aria-label="Start date"
            />
          </FormField>
          <FormField
            label="End Date"
            required
            error={showError("endDate") ? errors.endDate : ""}
          >
            <AdminDatePicker
              value={form.endDate}
              onChange={(value) => {
                setField("endDate", value);
                touch("endDate");
              }}
              placeholder="Select end date"
              disabled={!canWrite}
              aria-label="End date"
            />
          </FormField>
          <FormField label="Country">
            <SearchableSelect
              inputClass={inputClass}
              value={form.country}
              onChange={(value) => setField("country", value)}
              options={PROJECT_URL_COUNTRY_OPTIONS}
              placeholder="Select Country"
              searchPlaceholder="Search country..."
              aria-label="Country"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Language">
            <SearchableSelect
              inputClass={inputClass}
              value={form.language}
              onChange={handleLanguageChange}
              options={PROJECT_URL_PRESCREEN_LANGUAGES}
              placeholder="Select Language"
              searchPlaceholder="Search language..."
              aria-label="Language"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Status">
            <SearchableSelect
              inputClass={inputClass}
              value={form.status || "Open"}
              onChange={(value) => setField("status", value || "Open")}
              options={PROJECT_URL_STATUS_OPTIONS}
              searchable={false}
              aria-label="Project status"
              disabled={!canWrite}
            />
          </FormField>
        </div>
      </TableCard>

      <SectionDivider />

      {!isMultiLink ? (
        <>
          <TableCard title="Survey Links" isDarkMode={isDarkMode}>
            <div className="grid gap-4 sm:grid-cols-1">
              <FormField label="Live Link">
                <input
                  className={inputClass}
                  value={form.liveLink}
                  onChange={(event) => setField("liveLink", event.target.value)}
                  onBlur={(event) =>
                    setField("liveLink", trimOnBlur(event.target.value))
                  }
                  placeholder="https://"
                  disabled={!canWrite}
                />
              </FormField>
              <FormField label="Test Link">
                <input
                  className={inputClass}
                  value={form.testLink}
                  onChange={(event) => setField("testLink", event.target.value)}
                  onBlur={(event) =>
                    setField("testLink", trimOnBlur(event.target.value))
                  }
                  placeholder="https://"
                  disabled={!canWrite}
                />
              </FormField>
            </div>
          </TableCard>

          <SectionDivider />
        </>
      ) : null}

      <TableCard title="Project Filters / Security" isDarkMode={isDarkMode}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InteractiveCheckbox
            label="Geo Location"
            checked={form.geoLocation}
            onChange={(checked) => setField("geoLocation", checked)}
            disabled={!canWrite}
          />
          <InteractiveCheckbox
            label="URL Protection"
            checked={form.urlProtection}
            onChange={(checked) => setField("urlProtection", checked)}
            disabled={!canWrite}
          />
          <InteractiveCheckbox
            label="Unique IP Address"
            checked={form.uniqueIp}
            onChange={(checked) => setField("uniqueIp", checked)}
            disabled={!canWrite}
          />
          <InteractiveCheckbox
            label="Fraud Detection"
            checked={form.fraudDetection}
            onChange={(checked) => setField("fraudDetection", checked)}
            disabled={!canWrite}
          />
          <InteractiveCheckbox
            label="Pre-Screen"
            checked={form.preScreen}
            onChange={(checked) =>
              setForm((prev) => ({
                ...prev,
                preScreen: checked,
                ...(checked
                  ? {}
                  : { preScreenerId: "", surveyGroupId: "" }),
              }))
            }
            disabled={!canWrite}
          />
        </div>

        {form.preScreen ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField
              label="Pre-Screen Group"
              required
              error={showError("preScreenerId") ? errors.preScreenerId : ""}
            >
              <SearchableSelect
                inputClass={inputClass}
                value={form.preScreenerId || form.surveyGroupId}
                onChange={(value) => {
                  setForm((prev) => ({
                    ...prev,
                    preScreenerId: value,
                    surveyGroupId: value,
                  }));
                  touch("preScreenerId");
                }}
                options={preScreenerOptions}
                placeholder={preScreenerPlaceholder}
                searchPlaceholder="Search pre-screen group..."
                aria-label="Pre-Screen Group"
                disabled={!canWrite || !form.language || isLoadingPreScreeners}
              />
            </FormField>
          </div>
        ) : null}
      </TableCard>

      <SectionDivider />

      <TableCard title="Redirect URLs" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-1">
          <FormField label="Complete URL">
            <input
              className={inputClass}
              value={form.redirectComplete}
              onChange={(event) => setField("redirectComplete", event.target.value)}
              onBlur={(event) =>
                setField("redirectComplete", trimOnBlur(event.target.value))
              }
              placeholder="https://"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Terminated URL">
            <input
              className={inputClass}
              value={form.redirectTerminate}
              onChange={(event) => setField("redirectTerminate", event.target.value)}
              onBlur={(event) =>
                setField("redirectTerminate", trimOnBlur(event.target.value))
              }
              placeholder="https://"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Over Quota URL">
            <input
              className={inputClass}
              value={form.redirectOverQuota}
              onChange={(event) => setField("redirectOverQuota", event.target.value)}
              onBlur={(event) =>
                setField("redirectOverQuota", trimOnBlur(event.target.value))
              }
              placeholder="https://"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Quality Term URL">
            <input
              className={inputClass}
              value={form.redirectQualityTerm}
              onChange={(event) =>
                setField("redirectQualityTerm", event.target.value)
              }
              onBlur={(event) =>
                setField("redirectQualityTerm", trimOnBlur(event.target.value))
              }
              placeholder="https://"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Survey Closed URL">
            <input
              className={inputClass}
              value={form.redirectSurveyClose}
              onChange={(event) =>
                setField("redirectSurveyClose", event.target.value)
              }
              onBlur={(event) =>
                setField("redirectSurveyClose", trimOnBlur(event.target.value))
              }
              placeholder="https://"
              disabled={!canWrite}
            />
          </FormField>
        </div>
      </TableCard>

      <SectionDivider />

      <TableCard title="Reward Information" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Reward Point"
            required
            error={
              showError("completeRewardPoints") ? errors.completeRewardPoints : ""
            }
          >
            <DecimalInput
              className={inputClass}
              value={form.completeRewardPoints}
              onChange={(value) =>
                setField("completeRewardPoints", sanitizeProjectUrlDecimal(value))
              }
              onBlur={() => touch("completeRewardPoints")}
              placeholder="e.g. 2.5"
              decimalPlaces={PROJECT_URL_CPI_MAX_DECIMALS}
              disabled={!canWrite}
              aria-invalid={Boolean(
                showError("completeRewardPoints") && errors.completeRewardPoints
              )}
            />
          </FormField>
          <FormField
            label="Validate Reward Points"
            error={
              showError("validateRewardPoints") ? errors.validateRewardPoints : ""
            }
          >
            <DecimalInput
              className={inputClass}
              value={form.validateRewardPoints}
              onChange={(value) =>
                setField("validateRewardPoints", sanitizeProjectUrlDecimal(value))
              }
              onBlur={() => touch("validateRewardPoints")}
              placeholder="e.g. 0.5"
              decimalPlaces={PROJECT_URL_CPI_MAX_DECIMALS}
              disabled={!canWrite}
              aria-invalid={Boolean(
                showError("validateRewardPoints") && errors.validateRewardPoints
              )}
            />
          </FormField>
        </div>
      </TableCard>

      {canWrite && (
        <div className="flex flex-wrap items-center gap-3 pt-6">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`${primaryBtnClass} flex min-w-[120px] items-center justify-center gap-2`}
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? "Saving..." : "Save Project"}
          </button>
          <button
            type="button"
            onClick={closeForm}
            disabled={isSaving}
            className={secondaryBtnClass}
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}

export default ProjectUrlsTab;
