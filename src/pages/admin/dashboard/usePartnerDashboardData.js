import { useEffect, useState } from "react";
import { getSessionPartnerId } from "../../../services/auth/sessionIdentity";
import {
  listSupplierMappings,
  mapSupplierMappingToRow,
} from "../../../modules/survey/services/supplierMappingApi";

function toMetricNumber(value) {
  const num = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(num) ? num : null;
}

function buildPartnerDashboardMetrics(rows) {
  const projectIds = new Set(rows.map((row) => row.projectId).filter(Boolean));
  const uniqueProjects = projectIds.size || rows.length;
  const activeCount = rows.filter((row) => row.statusActive).length;
  const inactiveCount = rows.filter((row) => !row.statusActive).length;

  const quotaValues = rows
    .map((row) => toMetricNumber(row.quota))
    .filter((value) => value != null);
  const usedValues = rows
    .map((row) => toMetricNumber(row.usedQuota))
    .filter((value) => value != null);

  const totalQuota = quotaValues.length > 0
    ? quotaValues.reduce((sum, value) => sum + value, 0)
    : null;
  const usedQuota = usedValues.length > 0
    ? usedValues.reduce((sum, value) => sum + value, 0)
    : null;
  const remainingQuota =
    totalQuota != null && usedQuota != null ? Math.max(totalQuota - usedQuota, 0) : null;

  const quotaByProject = rows
    .map((row) => ({
      label: row.projectName || row.projectId || row.partnerCode || "Project",
      value: toMetricNumber(row.quota) ?? 0,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const statusSeries = [
    { label: "Active", value: activeCount, color: "#10a950" },
    { label: "Inactive", value: inactiveCount, color: "#94a3b8" },
  ].filter((item) => item.value > 0);

  return {
    rows,
    recentRows: rows.slice(0, 8),
    activeCount,
    inactiveCount,
    projectCount: uniqueProjects,
    totalQuota,
    usedQuota,
    remainingQuota,
    quotaByProject,
    statusSeries,
  };
}

export function usePartnerDashboardData({ enabled = true } = {}) {
  const partnerId = getSessionPartnerId();
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({
    loading: Boolean(enabled),
    error: "",
    rows: [],
    recentRows: [],
    activeCount: 0,
    inactiveCount: 0,
    projectCount: 0,
    totalQuota: null,
    usedQuota: null,
    remainingQuota: null,
    quotaByProject: [],
    statusSeries: [],
  });

  const retry = () => setReloadToken((value) => value + 1);

  useEffect(() => {
    if (!enabled) {
      setState((prev) => ({ ...prev, loading: false }));
      return undefined;
    }
    if (!partnerId) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "",
        rows: [],
        recentRows: [],
        projectCount: 0,
      }));
      return undefined;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: "" }));

    listSupplierMappings({ partnerId })
      .then((records) => {
        if (cancelled) return;
        const rows = (Array.isArray(records) ? records : [])
          .map((record, index) => mapSupplierMappingToRow(record, index))
          .filter((row) => String(row.partnerId) === String(partnerId));
        setState({
          loading: false,
          error: "",
          ...buildPartnerDashboardMetrics(rows),
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: error?.message || "Unable to load partner dashboard.",
          rows: [],
          recentRows: [],
          activeCount: 0,
          inactiveCount: 0,
          projectCount: 0,
          totalQuota: null,
          usedQuota: null,
          remainingQuota: null,
          quotaByProject: [],
          statusSeries: [],
        });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, partnerId, reloadToken]);

  return { ...state, partnerId, retry };
}
