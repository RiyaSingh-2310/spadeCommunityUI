const STORAGE_KEY = "system-email-templates";

const DEFAULT_BODY = `<p>Hello {{name}},</p><p>Welcome to Speed Community.</p><p>Thank you for registering.</p><p>Regards,<br/>Speed Community Team</p>`;

const INITIAL_TEMPLATES = [
  {
    id: "et-1",
    title: "Registration Email Template",
    subject: "Welcome to Speed Community",
    body: DEFAULT_BODY,
  },
  {
    id: "et-2",
    title: "Forget Password Email Template",
    subject: "Reset Your Password",
    body: `<p>Hello {{name}},</p><p>Click the link below to reset your password.</p><p>Regards,<br/>Speed Community Team</p>`,
  },
  {
    id: "et-3",
    title: "Project Manager Registration Email Template",
    subject: "Project Manager Account Created",
    body: `<p>Hello {{name}},</p><p>Your Project Manager account has been created.</p><p>Regards,<br/>Speed Community Team</p>`,
  },
  {
    id: "et-4",
    title: "Survey Invitation Email Template",
    subject: "You Are Invited to a Survey",
    body: DEFAULT_BODY,
  },
  {
    id: "et-5",
    title: "Reward Redemption Email Template",
    subject: "Your Reward Redemption Request",
    body: DEFAULT_BODY,
  },
  {
    id: "et-6",
    title: "Account Verification Email Template",
    subject: "Verify Your Account",
    body: DEFAULT_BODY,
  },
  {
    id: "et-7",
    title: "Partner Welcome Email Template",
    subject: "Welcome Partner",
    body: DEFAULT_BODY,
  },
  {
    id: "et-8",
    title: "Client Onboarding Email Template",
    subject: "Client Account Setup",
    body: DEFAULT_BODY,
  },
  {
    id: "et-9",
    title: "Survey Completion Email Template",
    subject: "Thank You for Completing the Survey",
    body: DEFAULT_BODY,
  },
  {
    id: "et-10",
    title: "Payment Confirmation Email Template",
    subject: "Payment Received",
    body: DEFAULT_BODY,
  },
  {
    id: "et-11",
    title: "Account Suspension Email Template",
    subject: "Account Status Update",
    body: DEFAULT_BODY,
  },
  {
    id: "et-12",
    title: "Newsletter Email Template",
    subject: "Speed Community Newsletter",
    body: DEFAULT_BODY,
  },
];

function mergeWithInitial(stored) {
  const existingIds = new Set(stored.map((t) => t.id));
  const missing = INITIAL_TEMPLATES.filter((t) => !existingIds.has(t.id));
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

export function loadEmailTemplates() {
  return readStore();
}

export function getEmailTemplateById(id) {
  return readStore().find((t) => t.id === id) ?? null;
}

export function saveEmailTemplate(template) {
  const list = readStore();
  const next = list.map((t) => (t.id === template.id ? template : t));
  writeStore(next);
  return template;
}

export function toListingRows(templates) {
  return templates.map((t, index) => ({
    id: t.id,
    sno: String(index + 1),
    title: t.title,
  }));
}
