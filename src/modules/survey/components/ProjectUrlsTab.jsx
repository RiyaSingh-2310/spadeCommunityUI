import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import FormField from "../../../components/admin/FormField";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import TableCard from "../../../components/admin/TableCard";
import { useModulePermission } from "../../permissions/useModulePermission";
import { getAdminInputClass, getAdminTextareaClass } from "../../shared/utils/formStyles";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  createEmptyProjectUrlForm,
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
  DetailField,
  DetailGrid,
  SectionDivider,
  primaryBtnClass,
} from "./surveyDetailsShared";

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

function ProjectUrlsTab({ surveyId, project, isDarkMode, onSaved }) {
  const { canWrite } = useModulePermission("survey");
  const inputClass = getAdminInputClass();
  const textareaClass = getAdminTextareaClass();
  const projectFk = project?.recordId ?? surveyId;
  const projectCode = project?.projectCode || project?.surveyId || "";
  const isMultiLink = String(project?.projectLinkType ?? "")
    .toLowerCase()
    .includes("multi");

  const [form, setForm] = useState(() => createEmptyProjectUrlForm(projectFk));
  const [selectedUrlId, setSelectedUrlId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preScreenerOptions, setPreScreenerOptions] = useState([]);
  const [isLoadingPreScreeners, setIsLoadingPreScreeners] = useState(false);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const existingUrlInfo = Array.isArray(project?.urlInfo) ? project.urlInfo : [];
        if (existingUrlInfo.length > 0) {
          if (cancelled) return;
          const mapped = mapApiUrlInfoToForm(existingUrlInfo[0], projectFk);
          setSelectedUrlId(mapped.id ? String(mapped.id) : "");
          setForm(mapped);
          return;
        }

        const response = await listProjectUrlsByProject(projectFk);
        if (cancelled) return;
        const rows = Array.isArray(response?.data) ? response.data : [];
        const selected = rows[0] ?? null;
        setSelectedUrlId(selected?.id != null ? String(selected.id) : "");
        setForm(
          selected
            ? selected.loi != null || selected.discussion != null || selected.liveLink != null
              ? { ...createEmptyProjectUrlForm(projectFk), ...selected }
              : mapProjectUrlToForm(selected)
            : createEmptyProjectUrlForm(projectFk)
        );
      } catch (error) {
        if (!cancelled) toastApiError(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [projectFk, project]);

  useEffect(() => {
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

        setForm((prev) => {
          if (!prev.preScreenerId && !prev.surveyGroupId) return prev;
          const selectedId = String(prev.preScreenerId || prev.surveyGroupId);
          const stillValid = options.some(
            (option) => String(option.value) === selectedId
          );
          return stillValid
            ? { ...prev, preScreenerId: selectedId, surveyGroupId: selectedId }
            : { ...prev, preScreenerId: "", surveyGroupId: "" };
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
  }, [form.language]);

  const preScreenerPlaceholder = useMemo(() => {
    if (!form.language) return "Select language in Survey Matrix first";
    if (isLoadingPreScreeners) return "Loading pre-screener groups...";
    if (preScreenerOptions.length === 0) return "No pre-screener groups found";
    return "Select Pre-Screener Group";
  }, [form.language, isLoadingPreScreeners, preScreenerOptions.length]);

  const handleLanguageChange = (language) => {
    setForm((prev) => ({
      ...prev,
      language,
      preScreenerId: "",
      surveyGroupId: "",
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!canWrite) return;
    setIsSaving(true);
    try {
      const payloadForm = {
        ...form,
        id: selectedUrlId || form.id,
        surveyGroupId: form.preScreenerId || form.surveyGroupId,
        preScreenerId: form.preScreenerId || form.surveyGroupId,
        ...(isMultiLink ? { liveLink: "", testLink: "" } : {}),
      };
      const data = await updateProjectUrls(projectFk, payloadForm, { project });
      toastApiSuccess(data);
      onSaved?.({
        projectId: projectFk,
        projectUrlId: selectedUrlId || form.id || data?.data?.id || "",
        response: data,
      });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-text flex items-center gap-2 text-sm">
        <Loader2 size={16} className="animate-spin" />
        Loading project URLs...
      </div>
    );
  }

  return (
    <form className="space-y-0" onSubmit={handleSave} noValidate>
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
          <FormField label="LOI">
            <input
              className={inputClass}
              type="number"
              step="0.1"
              value={form.loi}
              onChange={(event) => setField("loi", event.target.value)}
              placeholder="e.g. 15"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="IR">
            <input
              className={inputClass}
              type="number"
              step="0.1"
              value={form.ir}
              onChange={(event) => setField("ir", event.target.value)}
              placeholder="e.g. 32"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="CPI">
            <input
              className={inputClass}
              type="number"
              step="0.01"
              value={form.cpiRate}
              onChange={(event) => setField("cpiRate", event.target.value)}
              placeholder="e.g. 2.5"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Sample Size">
            <input
              className={inputClass}
              type="number"
              value={form.sampleSize}
              onChange={(event) => setField("sampleSize", event.target.value)}
              placeholder="e.g. 500"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Start Date">
            <input
              className={inputClass}
              type="date"
              value={form.startDate}
              onChange={(event) => setField("startDate", event.target.value)}
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="End Date">
            <input
              className={inputClass}
              type="date"
              value={form.endDate}
              onChange={(event) => setField("endDate", event.target.value)}
              disabled={!canWrite}
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
              aria-label="Survey matrix status"
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
                  placeholder="https://"
                  disabled={!canWrite}
                />
              </FormField>
              <FormField label="Test Link">
                <input
                  className={inputClass}
                  value={form.testLink}
                  onChange={(event) => setField("testLink", event.target.value)}
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
            label="PreScreen"
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
            <FormField label="Pre-Screener Group">
              <SearchableSelect
                inputClass={inputClass}
                value={form.preScreenerId || form.surveyGroupId}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    preScreenerId: value,
                    surveyGroupId: value,
                  }))
                }
                options={preScreenerOptions}
                placeholder={preScreenerPlaceholder}
                searchPlaceholder="Search pre-screener group..."
                aria-label="Pre-Screener Group"
                disabled={!canWrite || !form.language || isLoadingPreScreeners}
              />
            </FormField>
          </div>
        ) : null}
      </TableCard>

      <SectionDivider />

      <TableCard title="Redirect URLs" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-1">
          <FormField label="Complete Status">
            <input
              className={inputClass}
              value={form.redirectComplete}
              onChange={(event) => setField("redirectComplete", event.target.value)}
              placeholder="https://"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Terminate Status">
            <input
              className={inputClass}
              value={form.redirectTerminate}
              onChange={(event) => setField("redirectTerminate", event.target.value)}
              placeholder="https://"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Over Quota Status">
            <input
              className={inputClass}
              value={form.redirectOverQuota}
              onChange={(event) => setField("redirectOverQuota", event.target.value)}
              placeholder="https://"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Quality Term Status">
            <input
              className={inputClass}
              value={form.redirectQualityTerm}
              onChange={(event) => setField("redirectQualityTerm", event.target.value)}
              placeholder="https://"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Survey Close Status">
            <input
              className={inputClass}
              value={form.redirectSurveyClose}
              onChange={(event) => setField("redirectSurveyClose", event.target.value)}
              placeholder="https://"
              disabled={!canWrite}
            />
          </FormField>
        </div>
      </TableCard>

      <SectionDivider />

      <TableCard title="Reward Information" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Complete Reward Points">
            <input
              className={inputClass}
              type="number"
              value={form.completeRewardPoints}
              onChange={(event) => setField("completeRewardPoints", event.target.value)}
              placeholder="e.g. 50"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Validate Reward Points">
            <input
              className={inputClass}
              type="number"
              value={form.validateRewardPoints}
              onChange={(event) => setField("validateRewardPoints", event.target.value)}
              placeholder="e.g. 10"
              disabled={!canWrite}
            />
          </FormField>
        </div>
      </TableCard>

      <SectionDivider />

      <TableCard title="Audit Fields" isDarkMode={isDarkMode}>
        <DetailGrid columns={3}>
          <DetailField label="Added By" value={form.addedBy} />
          <DetailField label="Added On" value={form.addedOn} />
          <DetailField label="Updated By" value={form.updatedBy} />
          <DetailField label="Updated On" value={form.updatedOn} />
          <DetailField label="Deleted By" value={form.deletedBy} />
          <DetailField label="Deleted On" value={form.deletedOn} />
        </DetailGrid>
      </TableCard>

      {canWrite && (
        <div className="flex flex-wrap items-center gap-3 pt-6">
          <button
            type="submit"
            disabled={isSaving}
            className={`${primaryBtnClass} flex min-w-[120px] items-center justify-center gap-2`}
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? "Saving..." : "Save Project URLs"}
          </button>
        </div>
      )}
    </form>
  );
}

export default ProjectUrlsTab;
