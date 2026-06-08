/**
 * Resolves total record count from common API list response shapes.
 * @param {object | null | undefined} data
 * @param {number} [fallbackLength=0]
 */
export function extractListTotalFromResponse(data, fallbackLength = 0) {
  if (!data || typeof data !== "object") {
    return fallbackLength;
  }

  const nested =
    data.data && typeof data.data === "object" && !Array.isArray(data.data)
      ? data.data
      : null;

  const candidates = [
    data.total,
    data.totalCount,
    data.totalRecords,
    data.total_count,
    data.total_records,
    data.count,
    nested?.total,
    nested?.totalCount,
    nested?.totalRecords,
    nested?.total_count,
    nested?.count,
    data.pagination?.total,
    data.pagination?.totalCount,
    data.meta?.total,
    data.meta?.totalCount,
  ];

  for (const value of candidates) {
    const num = Number(value);
    if (Number.isFinite(num) && num >= 0) {
      return num;
    }
  }

  return fallbackLength;
}
