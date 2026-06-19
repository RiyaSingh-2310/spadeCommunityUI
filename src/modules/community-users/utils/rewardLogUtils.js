import { formatAuditLogDate } from "../../../services/activity/activityApi";

const REWARD_REASONS = [
  "Survey Completion",
  "Referral Bonus",
  "Manual Adjustment",
  "Reward Redemption",
  "Survey Participation",
];

function buildRewardLogDate(seed, index) {
  const day = 1 + ((seed + index * 3) % 28);
  const month = 2 + ((seed + index) % 10);
  const hours = 8 + ((seed + index * 2) % 12);
  const minutes = (seed * 7 + index * 11) % 60;
  const date = new Date(2026, month, day, hours, minutes);
  return {
    iso: date.toISOString(),
    display: formatAuditLogDate(date.toISOString()),
  };
}

export function buildRewardLogs(userId, seed) {
  const pointValues = [100, 250, -50, 150, -25, 300, 75, -40];
  const count = 6 + (seed % 4);

  return Array.from({ length: count }, (_, index) => {
    const rawPoints = pointValues[(seed + index) % pointValues.length];
    const reason = REWARD_REASONS[(seed + index) % REWARD_REASONS.length];
    const { iso, display } = buildRewardLogDate(seed, index);

    return {
      id: index + 1,
      rewardPoints: rawPoints > 0 ? `+${rawPoints}` : String(rawPoints),
      reason,
      date: display,
      dateIso: iso,
      pointsValue: rawPoints,
    };
  });
}

export function normalizeRewardLogEntry(entry, index) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  if (entry.rewardPoints != null && entry.reason != null && entry.date != null) {
    const pointsText = String(entry.rewardPoints);
    const numericPoints = Number(pointsText.replace(/[+,]/g, ""));
    return {
      id: entry.id ?? index + 1,
      rewardPoints: pointsText.startsWith("+") || pointsText.startsWith("-")
        ? pointsText
        : numericPoints > 0
          ? `+${pointsText}`
          : pointsText,
      reason: entry.reason,
      date: entry.date,
      dateIso: entry.dateIso ?? entry.date,
      pointsValue: Number.isFinite(numericPoints)
        ? numericPoints
        : Number(pointsText) || 0,
    };
  }

  const legacyPoints = Number(entry.points ?? 0);
  const legacyReason = entry.source ?? entry.reason ?? "Survey Completion";
  const legacyDate = entry.date ?? "—";

  return {
    id: entry.id ?? index + 1,
    rewardPoints: legacyPoints > 0 ? `+${legacyPoints}` : String(legacyPoints),
    reason: legacyReason,
    date: legacyDate,
    dateIso: entry.dateIso ?? legacyDate,
    pointsValue: legacyPoints,
  };
}
