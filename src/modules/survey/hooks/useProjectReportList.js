import { useCallback } from "react";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { fetchProjectReportList } from "../services/projectReportApi";

/**
 * @param {{
 *   projectId?: string|number,
 *   reportType?: string,
 *   supplierId?: string|number,
 *   enabled?: boolean,
 * }} options
 */
export function useProjectReportList({
  projectId,
  reportType,
  supplierId,
  enabled = true,
} = {}) {
  const resolvedProjectId = String(projectId ?? "").trim();
  const resolvedSupplierId = String(supplierId ?? "").trim();
  const canLoad = enabled && Boolean(resolvedProjectId);

  const fetchFn = useCallback(
    async ({ page, limit, search }) => {
      return fetchProjectReportList({
        projectId: resolvedProjectId,
        reportType,
        supplierId: resolvedSupplierId,
        page,
        limit,
        search,
      });
    },
    [resolvedProjectId, reportType, resolvedSupplierId]
  );

  const listing = useApiListing({
    fetchFn,
    enabled: canLoad,
    preserveRowOrder: true,
  });

  return listing;
}
