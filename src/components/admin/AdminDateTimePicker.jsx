import { useEffect, useState } from "react";
import AdminDatePicker from "./AdminDatePicker";
import AdminTimePicker, { formatTimeValue, parseTimeValue } from "./AdminTimePicker";

function splitDateTimeValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return { date: "", time: "" };

  if (raw.includes("T")) {
    const [date, timePart = ""] = raw.split("T");
    const parsed = parseTimeValue(timePart);
    return { date, time: formatTimeValue(parsed.hour, parsed.minute) };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { date: raw, time: "" };
  }

  const parsed = parseTimeValue(raw);
  return { date: "", time: formatTimeValue(parsed.hour, parsed.minute) };
}

function combineDateTime(date, time) {
  if (!date) return "";
  return `${date}T${time || "00:00"}`;
}

function AdminDateTimePicker({
  value = "",
  onChange,
  disabled = false,
  className = "",
  "aria-label": ariaLabel = "Select date and time",
}) {
  const { date, time } = splitDateTimeValue(value);
  const [draftTime, setDraftTime] = useState(time);

  useEffect(() => {
    setDraftTime(time);
  }, [time]);

  return (
    <div className={`admin-datetime-picker ${className}`.trim()} aria-label={ariaLabel}>
      <AdminDatePicker
        value={date}
        onChange={(nextDate) => onChange?.(combineDateTime(nextDate, draftTime))}
        disabled={disabled}
        placeholder="Select date"
        aria-label="Select date"
      />
      <AdminTimePicker
        value={draftTime}
        onChange={(nextTime) => {
          setDraftTime(nextTime);
          if (date) onChange?.(combineDateTime(date, nextTime));
        }}
        disabled={disabled}
        placeholder="Select time"
        aria-label="Select time"
      />
    </div>
  );
}

export default AdminDateTimePicker;
