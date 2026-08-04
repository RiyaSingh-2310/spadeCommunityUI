import {
  DEFAULT_DECIMAL_PLACES,
  handleDecimalPaste,
  preventBlockedNumericKeys,
  preventWheelValueChange,
  sanitizeDecimal,
} from "../../modules/shared/utils/numericInputUtils";

/** Decimal input with max 2 places after the decimal point by default. */
function DecimalInput({
  value,
  onChange,
  className = "",
  decimalPlaces = DEFAULT_DECIMAL_PLACES,
  onKeyDown,
  ...props
}) {
  const handleChange = (event) => {
    onChange(sanitizeDecimal(event.target.value, decimalPlaces));
  };

  const handleKeyDown = (event) => {
    preventBlockedNumericKeys(event);
    onKeyDown?.(event);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      {...props}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={(e) => handleDecimalPaste(e, onChange, decimalPlaces)}
      onWheel={preventWheelValueChange}
      className={`admin-number-input ${className}`}
    />
  );
}

export default DecimalInput;
