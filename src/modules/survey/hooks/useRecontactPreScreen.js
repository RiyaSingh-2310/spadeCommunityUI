import { useEffect, useState } from "react";
import { getQuestionnaireOptionsForLanguage } from "../../../services/question-library/questionLibraryApi";
import { getRecordForForm } from "../../../services/questionnaire-group/questionnaireGroupApi";
import { getSurveyGroupOptionsForLanguage } from "../services/projectUrlsApi";

/**
 * Loads Pre-Screen survey groups for the selected language, then the group's
 * language-specific questions once a survey group is chosen.
 */
export function useRecontactPreScreen({ language, surveyGroup, enabled }) {
  const [surveyGroupOptions, setSurveyGroupOptions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  useEffect(() => {
    if (!enabled || !String(language ?? "").trim()) {
      setSurveyGroupOptions([]);
      setIsLoadingGroups(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoadingGroups(true);

    getSurveyGroupOptionsForLanguage(language)
      .then((response) => {
        if (!cancelled) setSurveyGroupOptions(response?.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setSurveyGroupOptions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingGroups(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, language]);

  useEffect(() => {
    const groupId = String(surveyGroup ?? "").trim();
    const languageKey = String(language ?? "").trim();
    if (!enabled || !groupId || !languageKey) {
      setQuestions([]);
      setIsLoadingQuestions(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoadingQuestions(true);

    Promise.all([
      getRecordForForm(groupId),
      getQuestionnaireOptionsForLanguage(languageKey, languageKey),
    ])
      .then(([group, languageOptions]) => {
        if (cancelled) return;
        const byId = new Map(
          (languageOptions ?? []).map((option) => [String(option.value), option.label])
        );
        const linked = Array.isArray(group?.linkedQuestions) ? group.linkedQuestions : [];
        const mapped = linked
          .map((item) => {
            const id = String(item?.id ?? "").trim();
            if (!id) return null;
            const title = String(
              item.questionTitle || byId.get(id) || ""
            ).trim();
            return title ? { id, questionTitle: title } : null;
          })
          .filter(Boolean);

        setQuestions(
          mapped.length
            ? mapped
            : (languageOptions ?? [])
                .filter((option) =>
                  linked.some((item) => String(item?.id) === String(option.value))
                )
                .map((option) => ({
                  id: String(option.value),
                  questionTitle: option.label,
                }))
        );
      })
      .catch(() => {
        if (!cancelled) setQuestions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingQuestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, language, surveyGroup]);

  return {
    surveyGroupOptions,
    questions,
    isLoadingGroups,
    isLoadingQuestions,
  };
}
