import { useEffect, useState } from "react";
import { getRecords as getPanelistRecords, getRecord as getPanelistRecord } from "../../../modules/community-users/services/communityUsersApi";
import { getRecords as getSurveyRecords } from "../../../modules/survey/services/surveyApi";
import { getRecords as getScreeningQuestions } from "../../../services/screening/screeningQuestionsApi";
import { fetchRewardHistoryList } from "../../../modules/reward-points/services/rewardHistoryApi";
import { MAX_API_LIST_LIMIT } from "../../../modules/shared/utils/listQueryParams";
import { bucketRewardPoints, buildQuestionVisualizations } from "./buildQuestionVisualizations";

const DETAIL_SAMPLE_SIZE = 50;
const DETAIL_BATCH_SIZE = 10;

function toNumber(value) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function settleValue(promise, fallback) {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

async function loadPanelistDetails(panelistItems) {
  const sample = panelistItems.slice(0, DETAIL_SAMPLE_SIZE);
  const details = [];
  for (let index = 0; index < sample.length; index += DETAIL_BATCH_SIZE) {
    const batch = sample.slice(index, index + DETAIL_BATCH_SIZE);
    const settled = await Promise.allSettled(batch.map((row) => getPanelistRecord(row.id)));
    settled.forEach((entry) => {
      if (entry.status === "fulfilled" && entry.value) {
        details.push(entry.value);
      }
    });
  }
  return details;
}

function questionKey(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function usePanelistAnalytics({ enabled = false } = {}) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({
    loading: Boolean(enabled),
    error: "",
    kpis: [],
    visualizations: [],
    rewardSeries: [],
    rewardBuckets: [],
    topPanelists: [],
    participation: [],
  });

  const retry = () => setReloadToken((value) => value + 1);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const [panelists, surveys, questions, rewards] = await Promise.all([
          getPanelistRecords({ page: 1, limit: MAX_API_LIST_LIMIT }),
          settleValue(getSurveyRecords({ page: 1, limit: MAX_API_LIST_LIMIT }), {
            items: [],
            total: 0,
          }),
          settleValue(getScreeningQuestions({ page: 1, limit: MAX_API_LIST_LIMIT }), {
            items: [],
            total: 0,
          }),
          settleValue(fetchRewardHistoryList({ page: 1, limit: MAX_API_LIST_LIMIT }), {
            items: [],
            total: 0,
          }),
        ]);

        const panelistItems = Array.isArray(panelists?.items) ? panelists.items : [];
        const surveyItems = Array.isArray(surveys?.items) ? surveys.items : [];
        const questionItems = Array.isArray(questions?.items) ? questions.items : [];
        const rewardItems = Array.isArray(rewards?.items) ? rewards.items : [];

        const answerRows = await loadPanelistDetails(panelistItems);
        if (cancelled) return;

        const grouped = new Map();
        questionItems.forEach((question, index) => {
          const title = String(
            question.questionText ?? question.questionTitle ?? question.title ?? question.question ?? ""
          ).trim();
          if (!title) return;
          const key = questionKey(title);
          grouped.set(key, {
            id: String(question.id ?? key),
            question: title,
            questionType: question.questionType ?? "",
            sortOrder: Number(question.sortOrder ?? index + 1) || index + 1,
            answers: [],
            respondentIds: new Set(),
          });
        });

        answerRows.forEach((panelist) => {
          (Array.isArray(panelist.profilingAnswers) ? panelist.profilingAnswers : []).forEach(
            (entry) => {
              const question = String(entry.question ?? "").trim();
              const answer = String(entry.answerOpted ?? "").trim();
              if (!question || !answer || answer === "—") return;
              const key = questionKey(question);
              if (!grouped.has(key)) {
                grouped.set(key, {
                  id: key,
                  question,
                  questionType: "",
                  sortOrder: grouped.size + 100,
                  answers: [],
                  respondentIds: new Set(),
                });
              }
              const bucket = grouped.get(key);
              bucket.answers.push(answer);
              if (panelist.id != null) bucket.respondentIds.add(String(panelist.id));
            }
          );
        });

        const sampledCount = answerRows.length;
        const visualizationInput = [...grouped.values()].map((item) => ({
          ...item,
          skipped: sampledCount > 0 ? Math.max(0, sampledCount - item.respondentIds.size) : 0,
        }));

        const rewardPoints = panelistItems.map((row) => toNumber(row.rewardPoints));
        const totalRewardPoints = rewardPoints.reduce((sum, value) => sum + value, 0);
        const completedSurveys = panelistItems.filter(
          (row) => String(row.prescreenCompleted).toLowerCase() === "yes"
        ).length;
        const activeProjects = surveyItems.filter(
          (row) => String(row.status ?? "").toLowerCase() === "active"
        ).length;

        const topPanelists = [...panelistItems]
          .sort((a, b) => toNumber(b.rewardPoints) - toNumber(a.rewardPoints))
          .slice(0, 8)
          .map((row) => ({
            id: row.id,
            name: row.name || row.emailAddress || `Panelist ${row.id}`,
            points: toNumber(row.rewardPoints),
          }));

        const rewardByType = new Map();
        rewardItems.forEach((row) => {
          const label = String(row.transactionType ?? row.rewardType ?? "Reward").trim() || "Reward";
          rewardByType.set(
            label,
            (rewardByType.get(label) || 0) + toNumber(row.points ?? row.credit ?? row.rewardPoints)
          );
        });

        const participation = [
          {
            label: "Questionnaire completed",
            value: completedSurveys,
            color: "#10a950",
          },
          {
            label: "Questionnaire pending",
            value: Math.max(0, panelistItems.length - completedSurveys),
            color: "#94a3b8",
          },
        ]
          .filter((row) => row.value > 0)
          .map((row) => ({
            ...row,
            percent: panelistItems.length
              ? Math.round((row.value / panelistItems.length) * 1000) / 10
              : 0,
          }));

        const projectParticipation = [
          {
            label: "Active projects",
            value: activeProjects,
            color: "#10a950",
          },
          {
            label: "Other projects",
            value: Math.max(0, surveyItems.length - activeProjects),
            color: "#3b82f6",
          },
        ]
          .filter((row) => row.value > 0)
          .map((row) => ({
            ...row,
            percent: surveyItems.length
              ? Math.round((row.value / surveyItems.length) * 1000) / 10
              : 0,
          }));

        if (cancelled) return;
        setState({
          loading: false,
          error: "",
          kpis: [
            { label: "Total Panelists", value: panelists?.total ?? panelistItems.length },
            { label: "Total Projects", value: surveys?.total ?? surveyItems.length },
            { label: "Completed Questionnaires", value: completedSurveys },
            { label: "Active Projects", value: activeProjects },
            { label: "Total Reward Points", value: totalRewardPoints },
            {
              label: "Average Reward Points",
              value: panelistItems.length
                ? Math.round(totalRewardPoints / panelistItems.length)
                : 0,
            },
            { label: "Survey Participation", value: completedSurveys },
            { label: "Reward Transactions", value: rewards?.total ?? rewardItems.length },
          ],
          visualizations: buildQuestionVisualizations(visualizationInput),
          rewardSeries: [...rewardByType.entries()].map(([label, value], index) => ({
            label,
            value,
            color: ["#10a950", "#3b82f6", "#f59e0b", "#8b5cf6"][index % 4],
          })),
          rewardBuckets: bucketRewardPoints(rewardPoints),
          topPanelists,
          participation: [...participation, ...projectParticipation],
        });
      } catch (error) {
        if (cancelled) return;
        setState({
          loading: false,
          error: error?.message || "Unable to load panelist analytics.",
          kpis: [],
          visualizations: [],
          rewardSeries: [],
          rewardBuckets: [],
          topPanelists: [],
          participation: [],
        });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, reloadToken]);

  return { ...state, retry };
}
