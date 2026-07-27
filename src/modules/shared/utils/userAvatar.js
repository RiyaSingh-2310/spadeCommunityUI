import { API_BASE_URL } from "../../../config/api";
import {
  prepareAdminSessionUser,
  resolvePermissionsFromRecord,
} from "../../permissions/permissionsUtils";

/**
 * Raw profile image value from an API record (field order matches backend shapes).
 * @param {Record<string, unknown> | string | null | undefined} record
 */
export function extractProfileImageSource(record) {
  if (record == null) return null;
  if (typeof record === "string") {
    const trimmed = record.trim();
    return trimmed || null;
  }
  if (typeof record !== "object" || Array.isArray(record)) return null;

  const candidates = [
    record.profile_image,
    record.profileImage,
    record.image_url,
    record.imageUrl,
    record.image,
    record.avatar,
    record.photo,
    record.photo_url,
    record.photoUrl,
  ];

  for (const value of candidates) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }

  return null;
}

/**
 * Resolves a profile image URL from an API record or raw path/URL string.
 * Relative upload paths are prefixed with the API origin when needed.
 * @param {Record<string, unknown> | string | null | undefined} recordOrSource
 */
export function resolveProfileImageUrl(recordOrSource) {
  const source = extractProfileImageSource(recordOrSource);
  return getValidImageUrl(source);
}

/**
 * Resolves API upload paths to a full URL for display.
 * Absolute `/uploads/...` URLs are rewritten to the current API origin so
 * stale localhost/prod hosts from older API responses still resolve correctly.
 * @param {string | null | undefined} imageUrl
 */
export function resolveMediaUrl(imageUrl) {
  if (imageUrl == null) return null;
  const trimmed = String(imageUrl).trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return trimmed;

  const origin = API_BASE_URL.replace(/\/api\/?$/, "");

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith("/uploads/")) {
        return `${origin}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      // Keep original absolute URL when parsing fails.
    }
    return trimmed;
  }

  if (trimmed.startsWith("/")) return `${origin}${trimmed}`;
  return `${origin}/${trimmed}`;
}

/**
 * Returns a display-ready image URL when present; otherwise null.
 * @param {string | null | undefined} imageUrl
 */
export function getValidImageUrl(imageUrl) {
  return resolveMediaUrl(imageUrl);
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

export function splitFullName(name) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/**
 * Normalizes any member/user row for Avatar (API shapes, demo data, snake_case).
 * @param {Record<string, unknown>} [record]
 */
export function resolveAvatarFromRecord(record = {}) {
  const name =
    (typeof record.name === "string" && record.name) ||
    (typeof record.displayName === "string" && record.displayName) ||
    "";

  const fromName = splitFullName(name);

  const firstName =
    (typeof record.firstName === "string" && record.firstName) ||
    (typeof record.first_name === "string" && record.first_name) ||
    fromName.firstName;

  const lastName =
    (typeof record.lastName === "string" && record.lastName) ||
    (typeof record.last_name === "string" && record.last_name) ||
    fromName.lastName;

  const imageUrl = resolveProfileImageUrl(record);

  return {
    firstName,
    lastName,
    imageUrl,
    displayName: getUserDisplayName(firstName, lastName, name),
    initials: getUserInitials(firstName, lastName),
  };
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

  const imageUrl = resolveProfileImageUrl(admin);

  const sessionAdmin = prepareAdminSessionUser(admin);
  const permissions =
    sessionAdmin?.permissions ?? resolvePermissionsFromRecord(admin);

  return {
    ...(sessionAdmin ?? admin),
    firstName,
    lastName,
    email: typeof admin.email === "string" ? admin.email : "",
    imageUrl,
    displayName: getUserDisplayName(firstName, lastName, admin.name),
    initials: getUserInitials(firstName, lastName),
    permission_type: admin.permission_type ?? admin.permissionType ?? "user",
    permissions,
  };
}
