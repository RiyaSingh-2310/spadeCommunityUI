/** @deprecated Use NumericInput (integer) or DecimalInput (decimal) instead. */
import DecimalInput from "./DecimalInput";
import NumericInput from "./NumericInput";

function AdminNumberInput({ allowDecimal = false, ...props }) {
  if (allowDecimal) {
    return <DecimalInput {...props} />;
  }
  return <NumericInput {...props} />;
}

export default AdminNumberInput;
