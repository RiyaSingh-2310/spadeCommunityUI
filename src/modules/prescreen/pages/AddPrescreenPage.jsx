import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import SearchableSelect from "../../../components/admin/SearchableSelect";
import TableCard from "../../../components/admin/TableCard";
import { PRESCREEN_LANGUAGES } from "../data/prescreenLanguages";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  getRecord,
  mapPrescreenToForm,
  saveRecord,
} from "../../../services/prescreen/prescreenQuestionnairesApi";
import { getAdminCancelButtonClass, getAdminInputClass } from "../../shared/utils/formStyles";

const MAPPED_OPTIONS_MAX_HEIGHT = 200;

const EMPTY_FORM = {
  language: "",
  questionTitle: "",
  mappedOptions: "",
  rightAnswer: "",
  status: "Active",
};

function parseMappedOptionsText(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function syncRightAnswer(rightAnswer, options) {
  const trimmed = rightAnswer.trim();
  if (!trimmed) return "";
  return options.includes(trimmed) ? trimmed : "";
}

function isPrescreenFormDirty(current, original) {
  if (!original) return false;
  return (
    current.language !== original.language ||
    current.questionTitle !== original.questionTitle ||
    current.mappedOptions !== original.mappedOptions ||
    current.rightAnswer !== original.rightAnswer
  );
}

function isPrescreenFormValid(form) {
  const rightAnswerOptions = parseMappedOptionsText(form.mappedOptions);
  if (!form.language.trim() || !form.questionTitle.trim()) return false;
  if (!rightAnswerOptions.length) return false;
  if (!form.rightAnswer.trim()) return false;
  return rightAnswerOptions.includes(form.rightAnswer.trim());
}

function AddPrescreenPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [optionDraft, setOptionDraft] = useState("");
  const [isLoadingRecord, setIsLoadingRecord] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mappedOptionsRef = useRef(null);

  const inputClass = getAdminInputClass();

  const adjustMappedOptionsHeight = useCallback(() => {
    const textarea = mappedOptionsRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, MAPPED_OPTIONS_MAX_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAPPED_OPTIONS_MAX_HEIGHT ? "auto" : "hidden";
    textarea.style.overflowX = "hidden";
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return undefined;

    let cancelled = false;

    const loadPrescreen = async () => {
      setIsLoadingRecord(true);
      setLoadFailed(false);

      try {
        const record = await getRecord(id);
        if (cancelled) return;
        const mapped = mapPrescreenToForm(record);
        setForm(mapped);
        setInitialSnapshot(mapped);
      } catch {
        if (cancelled) return;
        setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoadingRecord(false);
      }
    };

    loadPrescreen();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  useEffect(() => {
    adjustMappedOptionsHeight();
  }, [form.mappedOptions, adjustMappedOptionsHeight]);

  const rightAnswerOptions = useMemo(() => {
    const options = parseMappedOptionsText(form.mappedOptions);
    const savedAnswer = form.rightAnswer.trim();
    if (savedAnswer && !options.includes(savedAnswer)) {
      return [...options, savedAnswer];
    }
    return options;
  }, [form.mappedOptions, form.rightAnswer]);

  const isDirty = useMemo(
    () => isEdit && isPrescreenFormDirty(form, initialSnapshot),
    [isEdit, form, initialSnapshot],
  );

  const canSubmit = useMemo(() => {
    if (!isPrescreenFormValid(form) || isSubmitting || isLoadingRecord || loadFailed) {
      return false;
    }
    if (isEdit) return isDirty;
    return true;
  }, [form, isSubmitting, isEdit, isDirty, isLoadingRecord, loadFailed]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddOption = () => {
    const nextOption = optionDraft.trim();
    if (!nextOption) return;

    const currentOptions = parseMappedOptionsText(form.mappedOptions);
    if (currentOptions.some((value) => value.toLowerCase() === nextOption.toLowerCase())) return;

    const nextText = currentOptions.length
      ? `${form.mappedOptions.replace(/\s+$/, "")}\n${nextOption}`
      : nextOption;

    setForm((prev) => ({
      ...prev,
      mappedOptions: nextText,
    }));
    setOptionDraft("");
  };

  const handleMappedOptionsChange = (value) => {
    setForm((prev) => {
      const options = parseMappedOptionsText(value);
      return {
        ...prev,
        mappedOptions: value,
        rightAnswer: syncRightAnswer(prev.rightAnswer, options),
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || (isEdit && !isDirty)) return;

    const mappedLines = parseMappedOptionsText(form.mappedOptions);

    setIsSubmitting(true);
    try {
      const data = await saveRecord({
        id: isEdit ? id : undefined,
        language: form.language.trim(),
        questionnaireTitle: form.questionTitle.trim(),
        questionType: "textbox",
        rightAnswer: form.rightAnswer.trim(),
        sortOrder: 0,
        status: isEdit ? initialSnapshot?.status ?? form.status : "Active",
        options: mappedLines,
      });

      toastApiSuccess(data);

      navigate("/prescreen", {
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
          title="Edit Question"
          breadcrumbs={[
            { label: "Screening Management", to: "/prescreen" },
            { label: "Question Library", to: "/prescreen" },
            { label: "Edit Question" },
          ]}
          isDarkMode={isDarkMode}
        />
        <div className="admin-text flex items-center gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading prescreen...
        </div>
      </div>
    );
  }

  if (isEdit && loadFailed) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Edit Question"
          breadcrumbs={[
            { label: "Screening Management", to: "/prescreen" },
            { label: "Question Library", to: "/prescreen" },
            { label: "Edit Question" },
          ]}
          isDarkMode={isDarkMode}
        />
        <p className="admin-text-muted text-sm">Prescreen not found.</p>
        <button
          type="button"
          onClick={() => navigate("/prescreen")}
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
        title={isEdit ? "Edit Question" : "Add Question"}
        breadcrumbs={[
          { label: "Screening Management", to: "/prescreen" },
          { label: "Question Library", to: "/prescreen" },
          { label: isEdit ? "Edit Question" : "Add Question" },
        ]}
        isDarkMode={isDarkMode}
      />
      <TableCard title="Prescreen Details" isDarkMode={isDarkMode}>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Language</label>
              <SearchableSelect
                inputClass={inputClass}
                value={form.language}
                onChange={(language) => setField("language", language)}
                options={PRESCREEN_LANGUAGES}
                placeholder="Select Language"
                searchPlaceholder="Search language..."
                aria-label="Select language"
              />
            </div>
            <div>
              <label className="admin-text mb-2 block text-sm font-semibold">Question Title</label>
              <input
                className={inputClass}
                placeholder="Enter Question Title"
                value={form.questionTitle}
                onChange={(e) => setField("questionTitle", e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="admin-text mb-2 block text-sm font-semibold">Add Option</label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  className={inputClass}
                  placeholder="Enter Option Text"
                  value={optionDraft}
                  onChange={(e) => setOptionDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="admin-text inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-4 text-sm font-semibold transition hover:opacity-90"
                  style={{ borderColor: "var(--admin-input-border)" }}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="admin-text mb-2 block text-sm font-semibold">Mapped Options</label>
              <textarea
                ref={mappedOptionsRef}
                className={inputClass}
                rows={3}
                value={form.mappedOptions}
                onChange={(e) => handleMappedOptionsChange(e.target.value)}
                placeholder="Mapped options will appear here after adding options"
                aria-label="Mapped options"
                style={{
                  resize: "none",
                  overflowX: "hidden",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              />
            </div>

            <div className="md:col-span-2">
              <label className="admin-text mb-2 block text-sm font-semibold">Right Answer</label>
              <SearchableSelect
                inputClass={inputClass}
                value={form.rightAnswer}
                onChange={(rightAnswer) => setField("rightAnswer", rightAnswer)}
                options={rightAnswerOptions}
                placeholder="Select Right Answer"
                searchPlaceholder="Search answer..."
                aria-label="Select right answer"
                disabled={rightAnswerOptions.length === 0}
              />
            </div>
          </div>

          <div className="admin-form-actions flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? "Update" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/prescreen")}
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

export default AddPrescreenPage;
