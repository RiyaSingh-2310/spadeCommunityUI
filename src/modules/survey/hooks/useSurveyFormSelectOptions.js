import { useEffect, useState } from "react";
import { getRecords as getClients } from "../../../services/clients/clientsApi";
import { getRecords as getProjectManagers } from "../../../services/projectManagers/projectManagersApi";
import { getRecords as getSalesManagers } from "../../../services/sales/salesManagersApi";
import { getRecords as getSalesProjects } from "../../../services/sales/salesProjectsApi";

export function mergeSelectOption(options = [], value, label) {
  const normalizedValue = String(value ?? "").trim();
  if (!normalizedValue) return options;

  if (options.some((option) => String(option.value) === normalizedValue)) {
    return options;
  }

  const normalizedLabel = String(label ?? "").trim();
  if (!normalizedLabel) return options;

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

export function mapSalesProjectsToSelectOptions(items = []) {
  return items
    .map((item) => ({
      value: String(item.recordId ?? item.id ?? ""),
      label: String(item.id ?? item.emailSubject ?? item.name ?? ""),
      searchText: [item.id, item.name, item.emailSubject, item.emailAddress]
        .filter(Boolean)
        .join(" "),
    }))
    .filter((option) => option.value);
}

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
      try {
        const [clients, projectManagers, salesManagers, salesProjects] = await Promise.all([
          getClients(),
          getProjectManagers(),
          getSalesManagers(),
          getSalesProjects(),
        ]);

        if (cancelled) return;

        setClientOptions(mapClientsToSelectOptions(clients.items));
        setProjectManagerOptions(mapProjectManagersToSelectOptions(projectManagers.items));
        setSalesManagerOptions(mapSalesManagersToSelectOptions(salesManagers.items));
        setSalesProjectOptions(mapSalesProjectsToSelectOptions(salesProjects.items));
      } catch {
        if (!cancelled) {
          setClientOptions([]);
          setProjectManagerOptions([]);
          setSalesManagerOptions([]);
          setSalesProjectOptions([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
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
    isLoading,
  };
}
