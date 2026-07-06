import { useMemo, useState } from "react";

function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

export function usePortalTable({
  rows,
  searchKeys = [],
  initialPageSize = 10,
  initialSort = { key: null, direction: "asc" },
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const languages = useMemo(
    () => [...new Set(rows.map((row) => row.language).filter(Boolean))].sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      if (statusFilter !== "all" && String(row.status).toLowerCase() !== statusFilter) {
        return false;
      }
      if (languageFilter !== "all" && row.language !== languageFilter) {
        return false;
      }
      if (!normalizedQuery) return true;

      return searchKeys.some((key) =>
        String(row[key] ?? "")
          .toLowerCase()
          .includes(normalizedQuery)
      );
    });
  }, [rows, query, statusFilter, languageFilter, searchKeys]);

  const sortedRows = useMemo(() => {
    if (!sort.key) return filteredRows;

    const direction = sort.direction === "desc" ? -1 : 1;
    return [...filteredRows].sort(
      (left, right) => compareValues(left[sort.key], right[sort.key]) * direction
    );
  }, [filteredRows, sort]);

  const total = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, safePage, pageSize]);

  const toggleSort = (key) => {
    setPage(1);
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  };

  const resetPageOnFilter = (updater) => {
    setPage(1);
    updater();
  };

  return {
    query,
    setQuery: (value) => resetPageOnFilter(() => setQuery(value)),
    statusFilter,
    setStatusFilter: (value) => resetPageOnFilter(() => setStatusFilter(value)),
    languageFilter,
    setLanguageFilter: (value) => resetPageOnFilter(() => setLanguageFilter(value)),
    languages,
    sort,
    toggleSort,
    page: safePage,
    setPage,
    pageSize,
    setPageSize: (value) => {
      setPage(1);
      setPageSize(value);
    },
    total,
    totalPages,
    pageRows,
    isEmpty: total === 0,
  };
}
