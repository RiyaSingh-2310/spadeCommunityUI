/**
 * Resolves a select option value by matching label text (case-insensitive).
 * @param {Array<{ value: string|number, label?: string }>} options
 * @param {string} label
 */
export function resolveSelectIdByLabel(options = [], label = "") {
  const normalized = String(label ?? "").trim().toLowerCase();
  if (!normalized) return "";

  const matched = options.find(
    (option) => String(option?.label ?? "").trim().toLowerCase() === normalized
  );

  return matched?.value != null && matched.value !== "" ? String(matched.value) : "";
}

/**
 * Resolves a client id from listing rows when only the client name is available.
 * @param {Array<{ id?: string|number, name?: string }>} records
 * @param {string} clientName
 * @param {string} [fallbackId]
 */
export function resolveClientIdByName(records = [], clientName = "", fallbackId = "") {
  if (fallbackId) return String(fallbackId);

  const normalized = String(clientName ?? "").trim().toLowerCase();
  if (!normalized) return "";

  const matched = records.find(
    (record) => String(record?.name ?? "").trim().toLowerCase() === normalized
  );

  return matched?.id != null && matched.id !== "" ? String(matched.id) : "";
}

/**
 * Applies resolved select ids to form state without marking the form dirty.
 * Updates both live form state and the initial snapshot when ids were missing.
 */
export function applyResolvedSelectIds(setForm, setInitialSnapshot, resolved = {}) {
  const entries = Object.entries(resolved).filter(([, value]) => value);
  if (!entries.length) return;

  setForm((prev) => {
    const next = { ...prev };
    let changed = false;

    for (const [key, value] of entries) {
      if (!prev[key] && value) {
        next[key] = value;
        changed = true;
      }
    }

    return changed ? next : prev;
  });

  setInitialSnapshot((prev) => {
    if (!prev) return prev;

    const next = { ...prev };
    let changed = false;

    for (const [key, value] of entries) {
      if (!prev[key] && value) {
        next[key] = value;
        changed = true;
      }
    }

    return changed ? next : prev;
  });
}
