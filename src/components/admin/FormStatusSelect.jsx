function FormStatusSelect({ value, onChange, inputClass, label = "Status" }) {
  return (
    <div>
      <label className="admin-text mb-2 block text-sm font-semibold">{label}</label>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="Active">Activated</option>
        <option value="Inactive">Deactivated</option>
      </select>
    </div>
  );
}

export default FormStatusSelect;
