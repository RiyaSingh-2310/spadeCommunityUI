import { useCallback, useState } from "react";
import {
  createEmptyTouched,
  isFormValid,
  markAllTouched,
  showFieldError,
} from "../utils/validation";

/**
 * Manages per-field touched state and submit-time validation for consistent form UX.
 *
 * @param {{ errors: Record<string, string>, fields: string[] }} options
 */
export function useFormValidation({ errors, fields }) {
  const [touched, setTouched] = useState(() => createEmptyTouched(fields));
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const touch = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const showError = useCallback(
    (field) => showFieldError(field, touched, errors, submitAttempted),
    [touched, errors, submitAttempted]
  );

  const validateSubmit = useCallback(() => {
    setSubmitAttempted(true);
    setTouched((prev) => markAllTouched(fields, prev));
    return isFormValid(errors);
  }, [fields, errors]);

  const resetValidation = useCallback(() => {
    setTouched(createEmptyTouched(fields));
    setSubmitAttempted(false);
  }, [fields]);

  return {
    touched,
    submitAttempted,
    touch,
    showError,
    validateSubmit,
    resetValidation,
    isValid: isFormValid(errors),
  };
}
