import { useEffect, useState } from "react";
import { getRecords as getSalesProjects } from "../../../services/sales/salesProjectsApi";
import {
  PROJECT_MANAGER_OPTIONS,
  RFQ_OPTIONS,
  SALES_MANAGER_OPTIONS,
  SURVEY_CLIENT_OPTIONS,
} from "../data/surveyFormData";
import { MAX_API_LIST_LIMIT } from "../../shared/utils/listQueryParams";

export function mergeSelectOption(options = [], value, label) {
  const normalizedValue = String(value ?? "").trim();
  if (!normalizedValue) return options;

  if (options.some((option) => String(option.value) === normalizedValue)) {
    return options;
  }

  const normalizedLabel = String(label ?? "").trim() || normalizedValue;
  return [{ value: normalizedValue, label: normalizedLabel }, ...options];
}

export function mapClientsToSelectOptions(items = []) {
  return items
    .map((item) => ({
      value: String(item.id ?? ""),
      label: item.name ?? "",
      searchText: [item.clientCode, item.name].filter(Boolean).join(" "),
    }))
    .filter((option) => option.value && option.label);
}

export function mapProjectManagersToSelectOptions(items = []) {
  return items
    .map((item) => ({
      value: String(item.id ?? ""),
      label: item.name ?? "",
    }))
    .filter((option) => option.value && option.label);
}

export function mapSalesManagersToSelectOptions(items = []) {
  return items
    .map((item) => ({
      value: String(item.id ?? ""),
      label: item.name ?? "",
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

/** Fallback IDs when RFQ list API is unavailable. */
function getMockSalesProjectOptions() {
  return RFQ_OPTIONS.map((option) => {
    const id = String(option.value ?? "").trim();
    return { value: id, label: id, searchText: id };
  }).filter((option) => option.value);
}

async function fetchAllSalesProjects() {
  const limit = MAX_API_LIST_LIMIT;
  const items = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await getSalesProjects({ page, limit });
    const pageItems = Array.isArray(response?.items) ? response.items : [];
    items.push(...pageItems);
    totalPages = Math.max(1, Number(response?.totalPages) || 1);
    page += 1;
  } while (page <= totalPages && page <= 50);

  return items;
}

/**
 * Loads select options for the project form.
 * Sales Project uses the live RFQ list API; other lists stay mock/API-ready.
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

      let salesProjects = [];
      try {
        const records = await fetchAllSalesProjects();
        salesProjects = mapSalesProjectsToSelectOptions(records);
      } catch {
        salesProjects = [];
      }

      if (cancelled) return;

      setClientOptions([...SURVEY_CLIENT_OPTIONS]);
      setProjectManagerOptions([...PROJECT_MANAGER_OPTIONS]);
      setSalesManagerOptions([...SALES_MANAGER_OPTIONS]);
      setSalesProjectOptions(
        salesProjects.length ? salesProjects : getMockSalesProjectOptions()
      );
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
