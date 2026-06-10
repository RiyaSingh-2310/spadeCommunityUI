import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import TableCard from "../../../components/admin/TableCard";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  createPrescreenGroup,
  getRecord,
  mapPrescreenGroupToForm,
  updatePrescreenGroup,
} from "../../../services/prescreen/prescreenGroupApi";
import { getQuestionnaireTitlesForLanguage } from "../../../services/prescreen/prescreenQuestionnairesApi";
import { PRESCREEN_LANGUAGES } from "../data/prescreenLanguages";
import { useAdminFormAccess } from "../../permissions/FormAccessContext";
import { useFormValidation } from "../../shared/hooks/useFormValidation";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";
import { STATUS_UI_ACTIVE } from "../../shared/utils/statusLabels";
import {
  getRequiredError,
  isFormValidForFields,
} from "../../shared/utils/validation";

const PRESCREEN_GROUP_FORM_FIELDS = ["language", "surveyTitle", "selectedQuestionnaire"];

const PRESCREEN_GROUP_REQUIRED_FIELDS = ["language", "surveyTitle", "selectedQuestionnaire"];

const EMPTY_FORM = {
  language: "",
  surveyTitle: "",
  selectedQuestionnaire: "",
  status: STATUS_UI_ACTIVE,
};

function AddPrescreenGroupPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [questionnaireOptions, setQuestionnaireOptions] = useState([]);
  const [isLoadingQuestionnaires, setIsLoadingQuestionnaires] = useState(false);
  const { readOnly, showSubmit, controlDisabled, canSubmitForm } = useAdminFormAccess(isSubmitting);

  const inputClass = getAdminInputClass();

  const errors = useMemo(
    () => ({
      language: getRequiredError(form.language, "Language"),
      surveyTitle: getRequiredError(form.surveyTitle, "Survey Group Title"),
      selectedQuestionnaire: getRequiredError(form.selectedQuestionnaire, "Select Questionnaire"),
    }),
    [form]
  );

  const { showError, touch, validateSubmit, resetValidation } = useFormValidation({
    errors,
    fields: PRESCREEN_GROUP_FORM_FIELDS,
  });

  useEffect(() => {
    if (!isEdit || !id) return undefined;

    let cancelled = false;

    const loadPrescreenGroup = async () => {
      resetValidation();
      setForm(EMPTY_FORM);
      setInitialSnapshot(null);
      setIsLoadingRecord(true);
      setLoadFailed(false);

      try {
        const record = await getRecord(id);
        if (cancelled) return;
        const mapped = mapPrescreenGroupToForm(record);
        setForm(mapped);
        setInitialSnapshot(mapped);
      } catch (error) {
        if (cancelled) return;
        toastApiError(error);
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoadingRecord(false);
      }
    };

    loadPrescreenGroup();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, resetValidation]);

  useEffect(() => {
    if (!form.language) {
      setQuestionnaireOptions([]);
      return undefined;
    }

    let cancelled = false;

    const loadQuestionnaires = async () => {
      setIsLoadingQuestionnaires(true);
      try {
        const titles = await getQuestionnaireTitlesForLanguage(form.language);
        if (!cancelled) setQuestionnaireOptions(titles);
      } catch {
        if (!cancelled) setQuestionnaireOptions([]);
      } finally {
        if (!cancelled) setIsLoadingQuestionnaires(false);
      }
    };

    loadQuestionnaires();
    return () => {
      cancelled = true;
    };
  }, [form.language]);

  const isDirty = useMemo(() => {
    if (!isEdit || !initialSnapshot) return false;
    return (
      form.surveyTitle !== initialSnapshot.surveyTitle ||
      form.selectedQuestionnaire !== initialSnapshot.selectedQuestionnaire
    );
  }, [isEdit, initialSnapshot, form]);

  const canSubmit =
    canSubmitForm &&
    isFormValidForFields(errors, PRESCREEN_GROUP_REQUIRED_FIELDS) &&
    !isSubmitting &&
    (!isEdit || isDirty) &&
    !isLoadingRecord &&
    !loadFailed;

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLanguageChange = (language) => {
    setForm((prev) => ({
      ...prev,
      language,
      selectedQuestionnaire: isEdit ? prev.selectedQuestionnaire : "",
    }));
    touch("language");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      readOnly ||
      !showSubmit ||
      !validateSubmit() ||
      !isFormValidForFields(errors, PRESCREEN_GROUP_REQUIRED_FIELDS) ||
      (isEdit && !isDirty)
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = isEdit
        ? await updatePrescreenGroup(id, form)
        : await createPrescreenGroup(form);

      toastApiSuccess(data);

      navigate("/prescreen/group", {
        replace: true,
        state: {
          flash: data.message ? { type: "success", message: data.message } : null,
          refresh: true,
        },
      });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEdit && isLoadingRecord) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Edit Survey Group"
          breadcrumbs={[
            { label: "Prescreen", to: "/prescreen/group" },
            { label: "Prescreen Group", to: "/prescreen/group" },
            { label: "Edit Survey Group" },
          ]}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text flex items-center gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading survey group...
        </div>
      </div>
    );
  }

  if (isEdit && loadFailed) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Edit Survey Group"
          breadcrumbs={[
            { label: "Prescreen", to: "/prescreen/group" },
            { label: "Prescreen Group", to: "/prescreen/group" },
            { label: "Edit Survey Group" },
          ]}
          isDarkMode={isDarkMode}
        />
        <p className="admin-text-muted text-sm">Survey group not found.</p>
        <button
          type="button"
          onClick={() => navigate("/prescreen/group")}
          className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={isEdit ? "Edit Survey Group" : "Add Survey Group"}
        breadcrumbs={[
          { label: "Prescreen", to: "/prescreen/group" },
          { label: "Prescreen Group", to: "/prescreen/group" },
          { label: isEdit ? "Edit Survey Group" : "Add Survey Group" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Survey Group Details" isDarkMode={isDarkMode}>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                Language
                <span className="text-[var(--admin-danger-text)]"> *</span>
              </label>
              <SearchableSelect
                inputClass={inputClass}
                value={form.language}
                onChange={handleLanguageChange}
                onBlur={() => touch("language")}
                options={PRESCREEN_LANGUAGES}
                placeholder="Select Language"
                searchPlaceholder="Search language..."
                aria-label="Select language"
                disabled={controlDisabled || isEdit}
              />
              {showError("language") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("language")}</p>
              )}
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">
                Survey Group Title
                <span className="text-[var(--admin-danger-text)]"> *</span>
              </label>
              <input
                className={inputClass}
                placeholder="Enter Survey Group Title"
                value={form.surveyTitle}
                onChange={(e) => setField("surveyTitle", e.target.value)}
                onBlur={() => touch("surveyTitle")}
                disabled={controlDisabled}
              />
              {showError("surveyTitle") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">{showError("surveyTitle")}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="admin-text mb-2 block text-sm font-semibold">
                Select Questionnaire
                <span className="text-[var(--admin-danger-text)]"> *</span>
              </label>
              <SearchableSelect
                inputClass={inputClass}
                value={form.selectedQuestionnaire}
                onChange={(selectedQuestionnaire) => {
                  setField("selectedQuestionnaire", selectedQuestionnaire);
                  touch("selectedQuestionnaire");
                }}
                onBlur={() => touch("selectedQuestionnaire")}
                options={questionnaireOptions}
                placeholder="Select Questionnaire"
                searchPlaceholder="Search questionnaire..."
                emptyMessage={
                  form.language
                    ? "No questionnaires found for this language"
                    : "Select a language first"
                }
                loading={isLoadingQuestionnaires}
                loadingLabel="Loading questionnaires..."
                aria-label="Select questionnaire"
                disabled={controlDisabled || !form.language}
              />
              {showError("selectedQuestionnaire") && (
                <p className="mt-1 text-xs text-[var(--admin-danger-text)]">
                  {showError("selectedQuestionnaire")}
                </p>
              )}
            </div>
          </div>
          <div className="admin-form-actions flex flex-wrap items-center gap-3 pt-2">
            {showSubmit && !readOnly && (
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? (isEdit ? "Updating..." : "Submitting...") : isEdit ? "Update" : "Submit"}
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/prescreen/group")}
              disabled={isSubmitting}
              className={getAdminCancelButtonClass()}
            >
              Cancel
            </button>
          </div>
        </form>
      </TableCard>
    </div>
  );
}

export default AddPrescreenGroupPage;
