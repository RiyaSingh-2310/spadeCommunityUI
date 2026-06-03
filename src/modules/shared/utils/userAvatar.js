/**
 * Returns a trimmed image URL when present; otherwise null.
 * @param {string | null | undefined} imageUrl
 */
export function getValidImageUrl(imageUrl) {
  if (imageUrl == null) return null;
  const trimmed = String(imageUrl).trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * @param {string} [firstName]
 * @param {string} [lastName]
 */
export function getUserInitials(firstName = "", lastName = "") {
  const first = firstName?.trim() || "";
  const last = lastName?.trim() || "";

  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }

  const parts = first.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

/**
 * @param {string} [firstName]
 * @param {string} [lastName]
 * @param {string} [fallbackName]
 */
export function getUserDisplayName(firstName = "", lastName = "", fallbackName = "") {
  const fromParts = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");
  if (fromParts) return fromParts;
  const fallback = fallbackName?.trim();
  return fallback || "Admin";
}

function splitFullName(name) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/**
 * Normalizes login API admin payload (camelCase or snake_case) for storage and UI.
 * @param {Record<string, unknown> | null | undefined} admin
 */
export function normalizeAdminUser(admin) {
  if (!admin || typeof admin !== "object") return null;

  const fromName = splitFullName(
    typeof admin.name === "string" ? admin.name : ""
  );

  const firstName =
    (typeof admin.firstName === "string" && admin.firstName) ||
    (typeof admin.first_name === "string" && admin.first_name) ||
    fromName.firstName;

  const lastName =
    (typeof admin.lastName === "string" && admin.lastName) ||
    (typeof admin.last_name === "string" && admin.last_name) ||
    fromName.lastName;

  const imageUrl = getValidImageUrl(
    (typeof admin.imageUrl === "string" && admin.imageUrl) ||
      (typeof admin.image_url === "string" && admin.image_url) ||
      null
  );

  return {
    ...admin,
    firstName,
    lastName,
    email: typeof admin.email === "string" ? admin.email : "",
    imageUrl,
    displayName: getUserDisplayName(firstName, lastName, admin.name),
    initials: getUserInitials(firstName, lastName),
  };
}
