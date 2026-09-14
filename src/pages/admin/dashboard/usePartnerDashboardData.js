import { useEffect, useState } from "react";
import { getSessionPartnerId } from "../../../services/auth/sessionIdentity";
import {
  listSupplierMappings,
  mapSupplierMappingToRow,
} from "../../../modules/survey/services/supplierMappingApi";

export function usePartnerDashboardData({ enabled = true } = {}) {
  const partnerId = getSessionPartnerId();
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState({
    loading: Boolean(enabled),
    error: "",
    rows: [],
    activeCount: 0,
    inactiveCount: 0,
    projectCount: 0,
  });

  const retry = () => setReloadToken((value) => value + 1);

  useEffect(() => {
    if (!enabled || !partnerId) {
      setState((prev) => ({ ...prev, loading: false, rows: [] }));
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
        const projectIds = new Set(rows.map((row) => row.projectId).filter(Boolean));
        setState({
          loading: false,
          error: "",
          rows: rows.slice(0, 8),
          activeCount: rows.filter((row) => row.statusActive).length,
          inactiveCount: rows.filter((row) => !row.statusActive).length,
          projectCount: projectIds.size || rows.length,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: error?.message || "Unable to load partner dashboard.",
          rows: [],
          activeCount: 0,
          inactiveCount: 0,
          projectCount: 0,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, partnerId, reloadToken]);

  return { ...state, partnerId, retry };
}
