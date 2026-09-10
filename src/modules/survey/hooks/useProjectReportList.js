import { useCallback, useState } from "react";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { fetchProjectReportList } from "../services/projectReportApi";

/**
 * @param {{
 *   projectId?: string|number,
 *   reportType?: string,
 *   supplierId?: string|number,
 *   mode?: string,
 *   enabled?: boolean,
 * }} options
 */
export function useProjectReportList({
  projectId,
  reportType,
  supplierId,
  mode = "live",
  enabled = true,
} = {}) {
  const resolvedProjectId = String(projectId ?? "").trim();
  const resolvedSupplierId = String(supplierId ?? "").trim();
  const resolvedMode = String(mode ?? "live").trim().toLowerCase() === "test" ? "test" : "live";
  const canLoad = enabled && Boolean(resolvedProjectId);
  const [summary, setSummary] = useState(null);

  const fetchFn = useCallback(
    async ({ page, limit, search }) => {
      const data = await fetchProjectReportList({
        projectId: resolvedProjectId,
        reportType,
        supplierId: resolvedSupplierId,
        mode: resolvedMode,
        page,
        limit,
        search,
      });
      setSummary(data?.summary ?? null);
      return data;
    },
    [resolvedProjectId, reportType, resolvedSupplierId, resolvedMode]
  );

  const listing = useApiListing({
    fetchFn,
    enabled: canLoad,
    preserveRowOrder: true,
  });

  return { ...listing, summary };
}
