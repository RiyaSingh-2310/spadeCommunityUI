import { getAdminUser, getAuthToken } from "./authStorage";
import { decodeJwtPayload } from "./jwtUtils";
import { isPartnerLoginRole } from "./loginRole";

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text && text !== "undefined" && text !== "null") return text;
  }
  return "";
}

/**
 * Partner id/email from a JWT issued by POST /api/partner/login.
 */
export function getPartnerIdentityFromToken(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload !== "object") {
    return { id: "", email: "" };
  }

  return {
    id: firstNonEmpty(
      payload.id,
      payload.partner_id,
      payload.partnerId,
      payload.partnerid,
      payload.sub
    ),
    email: firstNonEmpty(payload.email, payload.login_id, payload.loginId),
  };
}

function getPartnerIdentityFromUser(user) {
  if (!user || typeof user !== "object") {
    return { id: "", email: "" };
  }

  return {
    id: firstNonEmpty(
      user.id,
      user.partner_id,
      user.partnerId,
      user.partnerid
    ),
    email: firstNonEmpty(user.email, user.login_id, user.loginId),
  };
}

/**
 * Authenticated Partner id from the session user or login JWT.
 * Never taken from the URL/query.
 */
export function getSessionPartnerId() {
  if (!isPartnerLoginRole()) return "";
  const fromUser = getPartnerIdentityFromUser(getAdminUser());
  if (fromUser.id) return fromUser.id;
  return getPartnerIdentityFromToken(getAuthToken()).id;
}

export function getSessionPartnerEmail() {
  if (!isPartnerLoginRole()) return "";
  const fromUser = getPartnerIdentityFromUser(getAdminUser());
  if (fromUser.email) return fromUser.email;
  return getPartnerIdentityFromToken(getAuthToken()).email;
}
