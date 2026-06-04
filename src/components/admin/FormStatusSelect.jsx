import {
  STATUS_UI_ACTIVE,
  STATUS_UI_INACTIVE,
} from "../../modules/shared/utils/statusLabels";

function FormStatusSelect({ value, onChange, inputClass, label = "Status" }) {
  return (
    <div>
      <label className="admin-text mb-2 block text-sm font-semibold">{label}</label>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value={STATUS_UI_ACTIVE}>{STATUS_UI_ACTIVE}</option>
        <option value={STATUS_UI_INACTIVE}>{STATUS_UI_INACTIVE}</option>
      </select>
    </div>
  );
}

export default FormStatusSelect;
