/**
 * Static demo messages for the Messages module UI.
 * Used until the final Messages API is ready — no backend calls.
 */
export const DEMO_MESSAGES = [
  {
    id: "msg-1001",
    name: "Sarah Mitchell",
    email: "sarah.mitchell@spadecommunity.com",
    subject: "Welcome to Spade Community",
    body: `Hi there,

Welcome to Spade Community! We're excited to have you on board.

Your account has been set up successfully. You can now explore surveys, track rewards, and manage your community profile from the dashboard.

If you have any questions, reply to this message or contact our support team.

Best regards,
The Spade Community Team`,
    date: "28/07/2026",
    time: "09:15 AM",
    dateTime: "28/07/2026, 09:15 AM",
    isRead: false,
  },
  {
    id: "msg-1002",
    name: "James Carter",
    email: "james.carter@spadecommunity.com",
    subject: "Survey Invitation",
    body: `Hello,

You have been invited to participate in a new survey: "Consumer Preferences Q3 2026".

Please complete the survey at your earliest convenience. Your feedback helps our partners deliver better products and services.

Estimated time: 8–10 minutes.

Thank you,
Survey Operations`,
    date: "27/07/2026",
    time: "02:40 PM",
    dateTime: "27/07/2026, 02:40 PM",
    isRead: true,
  },
  {
    id: "msg-1003",
    name: "Priya Desai",
    email: "priya.desai@spadecommunity.com",
    subject: "Project Update",
    body: `Hi,

This is a quick update on Project Aurora.

Phase 1 screening is complete, and Phase 2 fieldwork is scheduled to begin next week. Please review the attached partner mapping notes in the portal when you have a moment.

Reach out if you need any clarification on timelines or quotas.

Regards,
Priya Desai
Project Management`,
    date: "25/07/2026",
    time: "11:05 AM",
    dateTime: "25/07/2026, 11:05 AM",
    isRead: false,
  },
  {
    id: "msg-1004",
    name: "Michael Brown",
    email: "michael.brown@spadecommunity.com",
    subject: "Account Verification",
    body: `Dear Member,

We need to verify a recent change to your account security settings.

If you initiated this change, no further action is required. If you did not, please secure your account immediately by resetting your password and contacting support.

Verification reference: ACC-VER-48291

Thank you for helping us keep Spade Community safe.

Security Team`,
    date: "22/07/2026",
    time: "04:22 PM",
    dateTime: "22/07/2026, 04:22 PM",
    isRead: true,
  },
  {
    id: "msg-1005",
    name: "Emma Wilson",
    email: "emma.wilson@spadecommunity.com",
    subject: "Reward Confirmation",
    body: `Hello,

Great news! Your reward request has been approved.

Reward type: Survey Completion
Points credited: 1,250
Status: Completed

You can view the full reward history under Reward Points in your account menu.

Thank you for participating!

Rewards Team`,
    date: "20/07/2026",
    time: "10:30 AM",
    dateTime: "20/07/2026, 10:30 AM",
    isRead: true,
  },
];

export function getDemoMessageById(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId) return null;
  return DEMO_MESSAGES.find((msg) => String(msg.id) === normalizedId) ?? null;
}

/** Shape used by the header notification drawer. */
export function getDemoRecentMessages() {
  return DEMO_MESSAGES.map((msg) => ({
    ...msg,
    title: msg.subject,
    description: msg.body,
    datetime: msg.dateTime,
    read: msg.isRead,
  }));
}
