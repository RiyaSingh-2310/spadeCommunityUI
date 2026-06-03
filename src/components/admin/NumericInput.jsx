import {
  preventBlockedNumericKeys,
  preventWheelValueChange,
  sanitizeInteger,
} from "../../modules/shared/utils/numericInputUtils";

/** Integer-only input: no decimals, no spinners, wheel-safe. */
function NumericInput({ value, onChange, className = "", ...props }) {
  const handleChange = (event) => {
    onChange(sanitizeInteger(event.target.value));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={value}
      onChange={handleChange}
      onKeyDown={preventBlockedNumericKeys}
      onWheel={preventWheelValueChange}
      className={`admin-number-input ${className}`}
      {...props}
    />
  );
}

export default NumericInput;
