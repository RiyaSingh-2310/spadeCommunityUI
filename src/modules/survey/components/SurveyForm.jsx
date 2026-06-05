import { useRef } from "react";
import { Download } from "lucide-react";
import DecimalInput from "../../../components/admin/DecimalInput";
import FormField from "../../../components/admin/FormField";
import FormRadioGroup from "../../../components/admin/FormRadioGroup";
import NumericInput from "../../../components/admin/NumericInput";
import RichTextEditor from "../../../components/admin/RichTextEditor";
import TableCard from "../../../components/admin/TableCard";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  PROJECT_LINK_TYPES,
  PROJECT_MANAGER_OPTIONS,
  SALES_MANAGER_OPTIONS,
  SALES_PROJECT_OPTIONS,
  SURVEY_CLIENT_OPTIONS,
  SURVEY_GROUP_OPTIONS,
  downloadSurveySampleCsv,
} from "../data/surveyFormData";

function FilterCheckbox({ label, checked, onChange, disabled }) {
  return (
    <label className="admin-text flex cursor-pointer items-center gap-2.5 text-sm font-medium">
      <input
        type="checkbox"
        className="admin-checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      {label}
    </label>
  );
}

function SurveyForm({
  form,
  setForm,
  errors,
  showError,
  touch,
  isDarkMode,
  disabled = false,
  groupProject = "",
  readOnlyClient = false,
  clientOptions = SURVEY_CLIENT_OPTIONS,
  projectManagerOptions = PROJECT_MANAGER_OPTIONS,
  salesManagerOptions = SALES_MANAGER_OPTIONS,
}) {
  const fileInputRef = useRef(null);
  const inputClass = getAdminInputClass();
  const selectClass = `${inputClass} appearance-none`;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setFilter = (key, value) =>
    setForm((prev) => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      ...(key === "preScreen" && !value ? { language: "", surveyGroup: "" } : {}),
    }));

  const handleCsvChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    if (file && !file.name.toLowerCase().endsWith(".csv")) {
      event.target.value = "";
      setField("surveyCsvFile", null);
      touch("surveyCsvFile");
      return;
    }
    setField("surveyCsvFile", file);
    touch("surveyCsvFile");
  };

  const isSingleLink = form.projectLinkType === "Single Link";

  return (
    <div className="space-y-5">
      <TableCard title="Project Information" isDarkMode={isDarkMode}>
        <div className="grid gap-4 md:grid-cols-2">
          {groupProject ? (
            <FormField label="Group Project">
              <input
                className={`${inputClass} opacity-70`}
                value={groupProject}
                disabled
                readOnly
              />
            </FormField>
          ) : null}

          <FormField label="Client" required error={showError("client")}>
            <select
              className={`${selectClass} ${readOnlyClient ? "opacity-70" : ""}`}
              value={form.client}
              onChange={(e) => setField("client", e.target.value)}
              onBlur={() => touch("client")}
              disabled={disabled || readOnlyClient}
            >
              <option value="">Select Client</option>
              {clientOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Project Name" required error={showError("projectName")}>
            <input
              className={inputClass}
              placeholder="Enter Project Name"
              value={form.projectName}
              onChange={(e) => setField("projectName", e.target.value)}
              onBlur={() => touch("projectName")}
              disabled={disabled}
            />
          </FormField>

          <FormField label="Project Manager" required error={showError("projectManager")}>
            <select
              className={selectClass}
              value={form.projectManager}
              onChange={(e) => setField("projectManager", e.target.value)}
              onBlur={() => touch("projectManager")}
              disabled={disabled}
            >
              <option value="">Select Project Manager</option>
              {projectManagerOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Project Country" required error={showError("projectCountry")}>
            <select
              className={selectClass}
              value={form.projectCountry}
              onChange={(e) => setField("projectCountry", e.target.value)}
              onBlur={() => touch("projectCountry")}
              disabled={disabled}
            >
              <option value="">Select Country</option>
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Sales Manager" error={showError("salesManager")}>
            <select
              className={selectClass}
              value={form.salesManager}
              onChange={(e) => setField("salesManager", e.target.value)}
              disabled={disabled}
            >
              <option value="">Select Sales Manager</option>
              {salesManagerOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Sales Project" error={showError("salesProject")}>
            <select
              className={selectClass}
              value={form.salesProject}
              onChange={(e) => setField("salesProject", e.target.value)}
              disabled={disabled}
            >
              <option value="">Select Sales Project</option>
              {SALES_PROJECT_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="mt-4">
          <FormField label="Project Description">
            <RichTextEditor
              value={form.description}
              onChange={(value) => setField("description", value)}
              isDarkMode={isDarkMode}
              placeholder="Enter Project Description"
              disabled={disabled}
            />
          </FormField>
        </div>
      </TableCard>

      <TableCard title="Survey Metrics" isDarkMode={isDarkMode}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField label="LOI (Minutes)" required error={showError("loi")}>
            <NumericInput
              className={inputClass}
              placeholder="Enter LOI"
              value={form.loi}
              onChange={(value) => setField("loi", value)}
              onBlur={() => touch("loi")}
              disabled={disabled}
            />
          </FormField>

          <FormField label="IR (%)" required error={showError("ir")}>
            <NumericInput
              className={inputClass}
              placeholder="Enter IR"
              value={form.ir}
              onChange={(value) => setField("ir", value)}
              onBlur={() => touch("ir")}
              disabled={disabled}
            />
          </FormField>

          <FormField label="Sample Size" required error={showError("sampleSize")}>
            <NumericInput
              className={inputClass}
              placeholder="Enter Sample Size"
              value={form.sampleSize}
              onChange={(value) => setField("sampleSize", value)}
              onBlur={() => touch("sampleSize")}
              disabled={disabled}
            />
          </FormField>

          <FormField label="Currency" required error={showError("currency")}>
            <select
              className={selectClass}
              value={form.currency}
              onChange={(e) => setField("currency", e.target.value)}
              onBlur={() => touch("currency")}
              disabled={disabled}
            >
              <option value="">Select Currency</option>
              {CURRENCY_OPTIONS.map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="CPI" required error={showError("cpi")}>
            <DecimalInput
              className={inputClass}
              placeholder="Enter CPI"
              value={form.cpi}
              onChange={(value) => setField("cpi", value)}
              onBlur={() => touch("cpi")}
              disabled={disabled}
            />
          </FormField>

          <FormField label="Start Date" required error={showError("startDate")}>
            <input
              type="date"
              className={inputClass}
              value={form.startDate}
              onChange={(e) => setField("startDate", e.target.value)}
              onBlur={() => touch("startDate")}
              disabled={disabled}
            />
          </FormField>

          <FormField label="End Date" required error={showError("endDate")}>
            <input
              type="date"
              className={inputClass}
              value={form.endDate}
              min={form.startDate || undefined}
              onChange={(e) => setField("endDate", e.target.value)}
              onBlur={() => touch("endDate")}
              disabled={disabled}
            />
          </FormField>
        </div>

        <div className="mt-4">
          <FormRadioGroup
            label="Project Link Type"
            name="projectLinkType"
            value={form.projectLinkType}
            onChange={(value) => {
              setField("projectLinkType", value);
              touch("projectLinkType");
              if (value === "Single Link") {
                setForm((prev) => ({ ...prev, surveyCsvFile: null }));
              } else {
                setForm((prev) => ({ ...prev, liveLink: "", testLink: "" }));
              }
            }}
            options={PROJECT_LINK_TYPES}
            isDarkMode={isDarkMode}
          />
        </div>

        {isSingleLink ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormField label="Live Link" required error={showError("liveLink")}>
              <input
                className={inputClass}
                placeholder="Enter Live Link"
                value={form.liveLink}
                onChange={(e) => setField("liveLink", e.target.value)}
                onBlur={() => touch("liveLink")}
                disabled={disabled}
              />
            </FormField>
            <FormField label="Test Link" required error={showError("testLink")}>
              <input
                className={inputClass}
                placeholder="Enter Test Link"
                value={form.testLink}
                onChange={(e) => setField("testLink", e.target.value)}
                onBlur={() => touch("testLink")}
                disabled={disabled}
              />
            </FormField>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <FormField
              label="Upload Survey File"
              required
              error={showError("surveyCsvFile")}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCsvChange}
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="admin-btn-cancel h-11 shrink-0 rounded-xl px-4 text-sm font-semibold"
                >
                  Choose File
                </button>
                <span className="admin-text-muted text-sm">
                  {form.surveyCsvFile?.name ?? "No file selected"}
                </span>
              </div>
              <p className="admin-text-subtle mt-1 text-xs">Supported format: CSV</p>
            </FormField>
            <button
              type="button"
              onClick={downloadSurveySampleCsv}
              className="admin-text inline-flex items-center gap-2 text-sm font-semibold text-[var(--admin-success-text)] transition hover:opacity-90"
            >
              <Download size={16} />
              Download Sample CSV
            </button>
          </div>
        )}
      </TableCard>

      <TableCard title="Project Filters" isDarkMode={isDarkMode}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterCheckbox
            label="Geo Location"
            checked={form.filters.geoLocation}
            onChange={(v) => setFilter("geoLocation", v)}
            disabled={disabled}
          />
          <FilterCheckbox
            label="URL Protection"
            checked={form.filters.urlProtection}
            onChange={(v) => setFilter("urlProtection", v)}
            disabled={disabled}
          />
          <FilterCheckbox
            label="Unique IP"
            checked={form.filters.uniqueIp}
            onChange={(v) => setFilter("uniqueIp", v)}
            disabled={disabled}
          />
          <FilterCheckbox
            label="Pre-Screen"
            checked={form.filters.preScreen}
            onChange={(v) => setFilter("preScreen", v)}
            disabled={disabled}
          />
        </div>

        {form.filters.preScreen && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormField label="Language" required error={showError("language")}>
              <select
                className={selectClass}
                value={form.language}
                onChange={(e) => setField("language", e.target.value)}
                onBlur={() => touch("language")}
                disabled={disabled}
              >
                <option value="">Select Language</option>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Survey Group" required error={showError("surveyGroup")}>
              <select
                className={selectClass}
                value={form.surveyGroup}
                onChange={(e) => setField("surveyGroup", e.target.value)}
                onBlur={() => touch("surveyGroup")}
                disabled={disabled}
              >
                <option value="">Select Survey Group</option>
                {SURVEY_GROUP_OPTIONS.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        )}
      </TableCard>

      <TableCard title="User Redirect Points" isDarkMode={isDarkMode}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="User Termination Point"
            required
            error={showError("userTerminationPoint")}
          >
            <input
              className={inputClass}
              placeholder="Enter User Termination Point"
              value={form.userTerminationPoint}
              onChange={(e) => setField("userTerminationPoint", e.target.value)}
              onBlur={() => touch("userTerminationPoint")}
              disabled={disabled}
            />
          </FormField>
          <FormField
            label="User Completion Point"
            required
            error={showError("userCompletionPoint")}
          >
            <input
              className={inputClass}
              placeholder="Enter User Completion Point"
              value={form.userCompletionPoint}
              onChange={(e) => setField("userCompletionPoint", e.target.value)}
              onBlur={() => touch("userCompletionPoint")}
              disabled={disabled}
            />
          </FormField>
        </div>
      </TableCard>

      <TableCard title="Notes" isDarkMode={isDarkMode}>
        <FormField label="Notes">
          <textarea
            className={`${inputClass} min-h-[120px] resize-y py-3`}
            placeholder="Enter Project Notes"
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            disabled={disabled}
          />
        </FormField>
      </TableCard>
    </div>
  );
}

export default SurveyForm;
