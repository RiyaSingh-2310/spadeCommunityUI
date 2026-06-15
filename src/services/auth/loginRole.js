export const LOGIN_ROLES = {
  ADMIN: "admin",
  SALES: "sales",
  MANAGER: "manager",
};

const LOGIN_ROLE_KEY = "loginRole";

export const DEFAULT_LOGIN_ROLE = LOGIN_ROLES.ADMIN;

export function saveLoginRole(role) {
  const normalized = String(role ?? "").trim().toLowerCase();
  const value = Object.values(LOGIN_ROLES).includes(normalized)
    ? normalized
    : DEFAULT_LOGIN_ROLE;
  localStorage.setItem(LOGIN_ROLE_KEY, value);
}

export function getLoginRole() {
  const stored = String(localStorage.getItem(LOGIN_ROLE_KEY) ?? "").trim().toLowerCase();
  if (Object.values(LOGIN_ROLES).includes(stored)) {
    return stored;
  }
  return DEFAULT_LOGIN_ROLE;
}

export function clearLoginRole() {
  localStorage.removeItem(LOGIN_ROLE_KEY);
}

export function isSalesLoginRole() {
  return getLoginRole() === LOGIN_ROLES.SALES;
}

export function isManagerLoginRole() {
  return getLoginRole() === LOGIN_ROLES.MANAGER;
}

export function isAdminLoginRole() {
  return getLoginRole() === LOGIN_ROLES.ADMIN;
}
