import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Shared list state + edit / delete / status handlers for ModuleListingPage.
 * @param {{
 *   initialRows: object[],
 *   editPath?: string,
 *   rowIdKey?: string,
 * }} options
 */
export function useListingPageActions({
  initialRows,
  editPath,
  rowIdKey = "id",
}) {
  const navigate = useNavigate();
  const [rows, setRows] = useState(initialRows);

  const getRowId = useCallback(
    (row) => row?.[rowIdKey] ?? row?.id,
    [rowIdKey]
  );

  const onEdit = useCallback(
    (row) => {
      if (!editPath) return;
      const id = getRowId(row);
      if (id == null) return;
      navigate(`${editPath.replace(/\/$/, "")}/edit/${encodeURIComponent(id)}`);
    },
    [editPath, getRowId, navigate]
  );

  const onDelete = useCallback(
    (row) => {
      const id = getRowId(row);
      setRows((prev) =>
        prev.filter((item) => String(getRowId(item)) !== String(id))
      );
    },
    [getRowId]
  );

  const onStatusToggle = useCallback(
    (row) => {
      const id = getRowId(row);
      setRows((prev) =>
        prev.map((item) =>
          String(getRowId(item)) === String(id)
            ? {
                ...item,
                status:
                  String(item.status).toLowerCase() === "active"
                    ? "Inactive"
                    : "Active",
              }
            : item
        )
      );
    },
    [getRowId]
  );

  return {
    rows,
    setRows,
    onEdit: editPath ? onEdit : undefined,
    onDelete,
    onStatusToggle,
  };
}
