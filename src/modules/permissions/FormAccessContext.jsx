import { createContext, useContext } from "react";
import PermissionDenied from "../../components/admin/PermissionDenied";
import { useFormPermissions } from "./useModulePermission";

const FormAccessContext = createContext({
  readOnly: false,
  showSubmit: true,
  allowed: true,
});

export function isFormRoute(pathname) {
  return (
    /\/(add|edit|settings|permissions)(\/|$)/.test(pathname) ||
    pathname === "/home-page" ||
    /^\/user-screening\/(questions|create-survey|panel-survey)/.test(pathname)
  );
}

export function FormAccessProvider({ isDarkMode, children }) {
  const access = useFormPermissions();

  if (!access.allowed) {
    return <PermissionDenied isDarkMode={isDarkMode} />;
  }

  return (
    <FormAccessContext.Provider
      value={{
        readOnly: access.readOnly,
        showSubmit: access.showSubmit,
        allowed: access.allowed,
      }}
    >
      {children}
    </FormAccessContext.Provider>
  );
}

export function useFormAccess() {
  return useContext(FormAccessContext);
}

/** @param {boolean} readOnly @param {boolean} [extra] */
export function fieldDisabled(readOnly, extra = false) {
  return readOnly || extra;
}

/** @param {boolean} [extraDisabled] */
export function useAdminFormAccess(extraDisabled = false) {
  const { readOnly, showSubmit, allowed } = useFormAccess();

  return {
    readOnly,
    showSubmit,
    allowed,
    controlDisabled: readOnly || extraDisabled,
    canSubmitForm: showSubmit && !readOnly && !extraDisabled,
    fieldDisabled: (extra = false) => readOnly || extraDisabled || extra,
  };
}
