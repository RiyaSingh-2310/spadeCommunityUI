import {
  handleIntegerPaste,
  preventBlockedNumericKeys,
  preventWheelValueChange,
  sanitizeInteger,
  sanitizeSignedInteger,
} from "../../modules/shared/utils/numericInputUtils";

/** Integer-only input: no decimals, no spinners, wheel-safe. */
function NumericInput({
  value,
  onChange,
  className = "",
  allowNegative = false,
  ...props
}) {
  const handleChange = (event) => {
    onChange(
      allowNegative
        ? sanitizeSignedInteger(event.target.value)
        : sanitizeInteger(event.target.value)
    );
  };

  const handleKeyDown = (event) => {
    if (
      allowNegative &&
      event.key === "-" &&
      (event.target.selectionStart ?? 0) === 0 &&
      !String(event.target.value ?? "").includes("-")
    ) {
      return;
    }
    preventBlockedNumericKeys(event);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={(e) => handleIntegerPaste(e, onChange, { allowNegative })}
      onWheel={preventWheelValueChange}
      className={`admin-number-input ${className}`}
      {...props}
    />
  );
}

export default NumericInput;
