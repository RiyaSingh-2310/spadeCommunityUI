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
  getPreScreenerOptions,
  getProjectUrls,
  mapApiUrlInfoToForm,
  mapProjectUrlToForm,
  PROJECT_URL_COUNTRY_OPTIONS,
  PROJECT_URL_LANGUAGE_OPTIONS,
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

function ProjectUrlsTab({ surveyId, project, isDarkMode }) {
  const { canWrite } = useModulePermission("survey");
  const inputClass = getAdminInputClass();
  const textareaClass = getAdminTextareaClass();
  const projectFk = project?.recordId ?? surveyId;

  const [form, setForm] = useState(() => createEmptyProjectUrlForm(projectFk));
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
        const apiUrlInfo = Array.isArray(project?.urlInfo) ? project.urlInfo[0] : null;
        if (apiUrlInfo) {
          if (!cancelled) {
            setForm(mapApiUrlInfoToForm(apiUrlInfo, projectFk));
          }
          return;
        }

        const response = await getProjectUrls(projectFk);
        if (cancelled) return;
        setForm(mapProjectUrlToForm(response?.data));
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
  }, [projectFk, project?.urlInfo]);

  useEffect(() => {
    let cancelled = false;

    const loadPreScreeners = async () => {
      setIsLoadingPreScreeners(true);
      try {
        const response = await getPreScreenerOptions({
          country: form.country,
          language: form.language,
        });
        if (cancelled) return;
        const options = response?.data ?? [];
        setPreScreenerOptions(options);

        setForm((prev) => {
          if (!prev.preScreenerId) return prev;
          const stillValid = options.some(
            (option) => String(option.value) === String(prev.preScreenerId)
          );
          return stillValid ? prev : { ...prev, preScreenerId: "" };
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
  }, [form.country, form.language]);

  const preScreenerPlaceholder = useMemo(() => {
    if (!form.country || !form.language) {
      return "Select country and language first";
    }
    if (isLoadingPreScreeners) return "Loading pre-screeners...";
    if (preScreenerOptions.length === 0) return "No pre-screeners found";
    return "Select Pre-Screener";
  }, [form.country, form.language, isLoadingPreScreeners, preScreenerOptions.length]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!canWrite) return;
    setIsSaving(true);
    try {
      const data = await updateProjectUrls(projectFk, form);
      toastApiSuccess(data);
      setForm(mapProjectUrlToForm(data?.data));
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
      <TableCard title="Basic" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Project ID (Foreign Key)">
            <input
              className={inputClass}
              value={form.projectId || String(projectFk ?? "")}
              readOnly
              disabled
            />
          </FormField>
          <FormField label="Client Project ID">
            <input
              className={inputClass}
              value={form.clientProjectId}
              onChange={(event) => setField("clientProjectId", event.target.value)}
              placeholder="Enter client project ID"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Client URL" className="sm:col-span-2">
            <input
              className={inputClass}
              value={form.clientUrl}
              onChange={(event) => setField("clientUrl", event.target.value)}
              placeholder="https://"
              disabled={!canWrite}
            />
          </FormField>
        </div>
      </TableCard>

      <SectionDivider />

      <TableCard title="Survey Information" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Discussion" className="sm:col-span-2 lg:col-span-3">
            <textarea
              className={textareaClass}
              value={form.discussion}
              onChange={(event) => setField("discussion", event.target.value)}
              placeholder="Enter discussion notes"
              rows={3}
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="LOI (Float)">
            <input
              className={inputClass}
              type="number"
              step="0.1"
              value={form.loi}
              onChange={(event) => setField("loi", event.target.value)}
              placeholder="e.g. 12.5"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="IR (Float)">
            <input
              className={inputClass}
              type="number"
              step="0.1"
              value={form.ir}
              onChange={(event) => setField("ir", event.target.value)}
              placeholder="e.g. 30"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="CPI Rate">
            <input
              className={inputClass}
              type="number"
              step="0.01"
              value={form.cpiRate}
              onChange={(event) => setField("cpiRate", event.target.value)}
              placeholder="e.g. 2.50"
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
              onChange={(value) => setField("language", value)}
              options={PROJECT_URL_LANGUAGE_OPTIONS}
              placeholder="Select Language"
              searchPlaceholder="Search language..."
              aria-label="Language"
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
        </div>
      </TableCard>

      <SectionDivider />

      <TableCard title="Status" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Status">
            <SearchableSelect
              inputClass={inputClass}
              value={form.status || "Open"}
              onChange={(value) => setField("status", value || "Open")}
              options={PROJECT_URL_STATUS_OPTIONS}
              searchable={false}
              aria-label="Project URL status"
              disabled={!canWrite}
            />
          </FormField>
        </div>
      </TableCard>

      <SectionDivider />

      <TableCard title="Links" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-1">
          <FormField label="Test Link">
            <input
              className={inputClass}
              value={form.testLink}
              onChange={(event) => setField("testLink", event.target.value)}
              placeholder="https://"
              disabled={!canWrite}
            />
          </FormField>
          <FormField label="Live Link">
            <input
              className={inputClass}
              value={form.liveLink}
              onChange={(event) => setField("liveLink", event.target.value)}
              placeholder="https://"
              disabled={!canWrite}
            />
          </FormField>
        </div>
      </TableCard>

      <SectionDivider />

      <TableCard title="Security Options" isDarkMode={isDarkMode}>
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
        </div>
      </TableCard>

      <SectionDivider />

      <TableCard title="Pre-Screener" isDarkMode={isDarkMode}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Pre-Screener">
            <SearchableSelect
              inputClass={inputClass}
              value={form.preScreenerId}
              onChange={(value) => setField("preScreenerId", value)}
              options={preScreenerOptions}
              placeholder={preScreenerPlaceholder}
              searchPlaceholder="Search pre-screener..."
              disabled={!canWrite || !form.country || !form.language || isLoadingPreScreeners}
              aria-label="Pre-Screener"
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
