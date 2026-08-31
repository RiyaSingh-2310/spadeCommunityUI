import { apiRequest } from "../../../services/api/client";

export const STATUS_ACTIVE = "active";
export const TABLE_HEAD =
  "px-3 py-3 text-left text-xs font-semibold tracking-[0.02em] whitespace-nowrap";

export function normalizeStatus(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function isStatus(value, target) {
  return normalizeStatus(value) === target;
}

export function toMonthKey(value) {
  const d = new Date(value ?? "");
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function buildLastMonths(length = 12) {
  const now = new Date();
  return Array.from({ length }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (length - idx - 1), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString(undefined, { month: "short" });
    return { key, label };
  });
}

export function buildMonthlySeries(rows, dateKey) {
  const months = buildLastMonths(12);
  const counts = new Map(months.map((m) => [m.key, 0]));
  rows.forEach((row) => {
    const key = toMonthKey(row?.[dateKey]);
    if (!key || !counts.has(key)) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return months.map((m) => ({ label: m.label, value: counts.get(m.key) ?? 0 }));
}

export function numberFmt(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

export async function fetchWithFallback(paths, fallback = { items: [], total: 0 }) {
  for (const path of paths) {
    try {
      const data = await apiRequest(path);
      const list =
        (Array.isArray(data?.data) && data.data) ||
        (Array.isArray(data?.items) && data.items) ||
        (Array.isArray(data?.records) && data.records) ||
        [];
      const total = Number(data?.total ?? data?.count ?? list.length) || list.length;
      return { items: list, total };
    } catch {
      // Try next path
    }
  }
  return fallback;
}
