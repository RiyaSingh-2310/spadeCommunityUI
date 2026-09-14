import { getAdminUser } from "./authStorage";
import { isPartnerLoginRole } from "./loginRole";

/**
 * Authenticated Partner id from the session user (never from URL/query).
 */
export function getSessionPartnerId() {
  if (!isPartnerLoginRole()) return "";
  const user = getAdminUser();
  return String(
    user?.id ?? user?.partner_id ?? user?.partnerId ?? user?.partnerid ?? ""
  ).trim();
}
