import {
  STATUS_UI_ACTIVE,
  STATUS_UI_INACTIVE,
} from "../../modules/shared/utils/statusLabels";
import SearchableSelect from "./SearchableSelect";

const STATUS_OPTIONS = [
  { value: STATUS_UI_ACTIVE, label: STATUS_UI_ACTIVE },
  { value: STATUS_UI_INACTIVE, label: STATUS_UI_INACTIVE },
];

function FormStatusSelect({ value, onChange, inputClass, label = "Status", disabled = false }) {
  return (
    <div>
      <label className="admin-text mb-2 block text-sm font-semibold">{label}</label>
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={STATUS_OPTIONS}
        placeholder="Select Status"
        disabled={disabled}
        inputClass={inputClass}
        searchable={false}
        aria-label={label}
      />
    </div>
  );
}

export default FormStatusSelect;
