import { useEffect, useState } from "react";
import { getRecords as getClients } from "../../../services/clients/clientsApi";
import { getRecords as getProjectManagers } from "../../../services/projectManagers/projectManagersApi";
import { getRecords as getSalesManagers } from "../../../services/sales/salesManagersApi";
import { getRecords as getSalesProjects } from "../../../services/sales/salesProjectsApi";
import { MAX_API_LIST_LIMIT } from "../../shared/utils/listQueryParams";
import { normalizeStatusKey } from "../../shared/utils/statusLabels";
import { resolveSelectIdByLabel } from "../../shared/utils/formPopulation";

export function mergeSelectOption(options = [], value, label) {
  const normalizedValue = String(value ?? "").trim();
  if (!normalizedValue) return options;

  if (options.some((option) => String(option.value) === normalizedValue)) {
    return options;
  }

  const normalizedLabel = String(label ?? "").trim() || normalizedValue;
  return [{ value: normalizedValue, label: normalizedLabel }, ...options];
}

/**
 * Ensures an option exists for an API-selected id or label (name-only responses).
 * Prefer matching by id, then by label; otherwise inject a synthetic option.
 */
export function ensureSelectOption(options = [], value, label) {
  const normalizedValue = String(value ?? "").trim();
  const normalizedLabel = String(label ?? "").trim();

  if (normalizedValue) {
    const byValue = options.find(
      (option) => String(option.value) === normalizedValue
    );
    if (byValue) return options;

    const byLabel = normalizedLabel
      ? options.find(
          (option) =>
            String(option.label ?? "").trim().toLowerCase() ===
            normalizedLabel.toLowerCase()
        )
      : null;
    if (byLabel) return options;

    return [
      {
        value: normalizedValue,
        label: normalizedLabel || normalizedValue,
      },
      ...options,
    ];
  }

  if (!normalizedLabel) return options;

  const byLabel = options.find(
    (option) =>
      String(option.label ?? "").trim().toLowerCase() ===
      normalizedLabel.toLowerCase()
  );
  if (byLabel) return options;

  return [
    {
      value: normalizedLabel,
      label: normalizedLabel,
    },
    ...options,
  ];
}

/**
 * Resolves a select value from id and/or display label against loaded options.
 */
export function resolveSelectValue(options = [], idValue, labelValue) {
  const normalizedId = String(idValue ?? "").trim();
  if (
    normalizedId &&
    options.some((option) => String(option.value) === normalizedId)
  ) {
    return normalizedId;
  }

  const byLabel = resolveSelectIdByLabel(options, labelValue);
  if (byLabel) return byLabel;

  if (normalizedId) return normalizedId;

  const normalizedLabel = String(labelValue ?? "").trim();
  return normalizedLabel;
}

/**
 * Maps Client Management API rows to select options.
 * @param {Array<{ id?: string|number, name?: string, clientCode?: string, status?: string }>} items
 * @param {{ activeOnly?: boolean }} [options]
 */
export function mapClientsToSelectOptions(items = [], { activeOnly = false } = {}) {
  return items
    .filter((item) => {
      if (!activeOnly) return true;
      return normalizeStatusKey(item?.status) !== "inactive";
    })
    .map((item) => ({
      value: String(item.id ?? ""),
      label: String(item.name ?? "").trim(),
      searchText: [item.clientCode, item.name].filter(Boolean).join(" "),
    }))
    .filter((option) => option.value && option.label);
}

export function mapProjectManagersToSelectOptions(items = []) {
  return items
    .map((item) => ({
      value: String(item.id ?? ""),
      label: String(item.name ?? "").trim(),
    }))
    .filter((option) => option.value && option.label);
}

export function mapSalesManagersToSelectOptions(items = []) {
  return items
    .map((item) => ({
      value: String(item.id ?? ""),
      label: String(item.name ?? "").trim(),
    }))
    .filter((option) => option.value && option.label);
}

/**
 * Sales Project dropdown from RFQ list — display and store RFQ ID only (no name).
 * @param {Array<{ id?: string|number, recordId?: string|number }>} items
 */
export function mapSalesProjectsToSelectOptions(items = []) {
  return items
    .map((item) => {
      const rfqId = String(item.id ?? "").trim();
      if (!rfqId) return null;
      return {
        value: rfqId,
        label: rfqId,
        searchText: rfqId,
      };
    })
    .filter(Boolean);
}

async function fetchAllPaginatedRecords(fetchPage) {
  const limit = MAX_API_LIST_LIMIT;
  const items = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await fetchPage({ page, limit });
    const pageItems = Array.isArray(response?.items) ? response.items : [];
    items.push(...pageItems);
    totalPages = Math.max(1, Number(response?.totalPages) || 1);
    page += 1;
  } while (page <= totalPages && page <= 50);

  return items;
}

async function fetchAllClients() {
  return fetchAllPaginatedRecords(getClients);
}

async function fetchAllProjectManagers() {
  return fetchAllPaginatedRecords(getProjectManagers);
}

async function fetchAllSalesManagers() {
  return fetchAllPaginatedRecords(getSalesManagers);
}

async function fetchAllSalesProjects() {
  return fetchAllPaginatedRecords(getSalesProjects);
}

/**
 * Loads select options for the project form.
 * Client / Project Manager / Sales Manager / Sales Project from live APIs only
 * (no hardcoded fallback lists).
 */
export function useSurveyFormSelectOptions() {
  const [clientOptions, setClientOptions] = useState([]);
  const [projectManagerOptions, setProjectManagerOptions] = useState([]);
  const [salesManagerOptions, setSalesManagerOptions] = useState([]);
  const [salesProjectOptions, setSalesProjectOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      setIsLoading(true);

      const [
        clientsResult,
        projectManagersResult,
        salesManagersResult,
        salesProjectsResult,
      ] = await Promise.allSettled([
        fetchAllClients(),
        fetchAllProjectManagers(),
        fetchAllSalesManagers(),
        fetchAllSalesProjects(),
      ]);

      if (cancelled) return;

      const clients =
        clientsResult.status === "fulfilled" ? clientsResult.value : [];
      const projectManagers =
        projectManagersResult.status === "fulfilled"
          ? projectManagersResult.value
          : [];
      const salesManagers =
        salesManagersResult.status === "fulfilled"
          ? salesManagersResult.value
          : [];
      const salesProjects =
        salesProjectsResult.status === "fulfilled"
          ? salesProjectsResult.value
          : [];

      setClientOptions(
        mapClientsToSelectOptions(clients, {
          activeOnly: false,
        })
      );
      setProjectManagerOptions(mapProjectManagersToSelectOptions(projectManagers));
      setSalesManagerOptions(mapSalesManagersToSelectOptions(salesManagers));
      setSalesProjectOptions(mapSalesProjectsToSelectOptions(salesProjects));
      setIsLoading(false);
    };

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    clientOptions,
    projectManagerOptions,
    salesManagerOptions,
    salesProjectOptions,
    /** @deprecated Use salesProjectOptions */
    rfqOptions: salesProjectOptions,
    isLoading,
  };
}
