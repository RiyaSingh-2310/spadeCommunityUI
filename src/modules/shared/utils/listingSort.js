/**
 * Sort listing rows by numeric/string id ascending for stable table order.
 * @param {Array<Record<string, unknown>>} items
 * @param {string} [idKey="id"]
 */
export function sortListingRowsByIdAsc(items, idKey = "id") {
  if (!Array.isArray(items) || items.length <= 1) {
    return Array.isArray(items) ? [...items] : [];
  }

  return [...items].sort((left, right) => {
    const leftId = left?.[idKey] ?? left?.id;
    const rightId = right?.[idKey] ?? right?.id;
    const leftNum = Number(leftId);
    const rightNum = Number(rightId);

    if (Number.isFinite(leftNum) && Number.isFinite(rightNum)) {
      return leftNum - rightNum;
    }

    return String(leftId ?? "").localeCompare(String(rightId ?? ""), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}
