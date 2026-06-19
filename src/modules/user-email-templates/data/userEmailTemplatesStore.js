const STORAGE_KEY = "user-email-templates";

const INITIAL_TEMPLATES = [
  {
    id: 3,
    emailTitle: "Email Template 2",
    description:
      "Dear {user_name},\n\nA new survey is available for you. Survey ID: {survey_id}\n\nPlease log in to your account to participate.\n\nThank you,\nSpade Community",
    status: "Active",
  },
  {
    id: 5,
    emailTitle: "Survey Re-invite",
    description:
      "Dear {user_name},\n\nWe noticed you have not completed survey {survey_id}. This is a friendly reminder to complete it and earn your reward points.\n\nThank you,\nSpade Community",
    status: "Active",
  },
  {
    id: 6,
    emailTitle: "New Survey Arrived",
    description:
      "Dear {user_name},\n\nA new survey matching your profile is now available. Click below to start survey {survey_id}.\n\nThank you,\nSpade Community",
    status: "Active",
  },
  {
    id: 7,
    emailTitle: "Survey Reminder",
    description:
      "Dear {user_name},\n\nThis is a reminder about your pending survey invitation for survey {survey_id}.\n\nThank you,\nSpade Community",
    status: "Active",
  },
  {
    id: 8,
    emailTitle: "Reward Redemption",
    description:
      "Dear {user_name},\n\nYour reward redemption request has been received. We will process it shortly.\n\nThank you,\nSpade Community",
    status: "Active",
  },
];

function mergeWithInitial(stored) {
  const existingIds = new Set(stored.map((template) => String(template.id)));
  const missing = INITIAL_TEMPLATES.filter((template) => !existingIds.has(String(template.id)));
  return missing.length > 0 ? [...stored, ...missing] : stored;
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...INITIAL_TEMPLATES];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [...INITIAL_TEMPLATES];
    return mergeWithInitial(parsed);
  } catch {
    return [...INITIAL_TEMPLATES];
  }
}

function writeStore(templates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function loadUserEmailTemplates() {
  return readStore();
}

export function getUserEmailTemplateById(id) {
  const normalized = String(id ?? "").trim();
  return readStore().find((template) => String(template.id) === normalized) ?? null;
}

export function saveUserEmailTemplate(template) {
  const list = readStore();
  const exists = list.some((item) => String(item.id) === String(template.id));
  const next = exists
    ? list.map((item) => (String(item.id) === String(template.id) ? { ...item, ...template } : item))
    : [...list, template];
  writeStore(next);
  return template;
}

export function createUserEmailTemplate({ emailTitle, description, status = "Active" }) {
  const list = readStore();
  const numericIds = list
    .map((item) => Number(item.id))
    .filter((value) => Number.isFinite(value));
  const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
  const template = {
    id: nextId,
    emailTitle: emailTitle.trim(),
    description: description.trim(),
    status,
  };
  writeStore([...list, template]);
  return template;
}

export function deleteUserEmailTemplate(id) {
  const normalized = String(id ?? "").trim();
  const next = readStore().filter((template) => String(template.id) !== normalized);
  writeStore(next);
}

export function updateUserEmailTemplateStatus(id, status) {
  const template = getUserEmailTemplateById(id);
  if (!template) return null;
  return saveUserEmailTemplate({ ...template, status });
}

export function toListingRows(templates) {
  return templates.map((template) => ({
    id: template.id,
    emailTitle: template.emailTitle,
    description: template.description,
    status: template.status,
  }));
}
