/** @type {import('../types').FindUserRecord[]} */
const FIRST_NAMES = [
  "Aarav",
  "Isha",
  "Rohan",
  "Priya",
  "Vikram",
  "Ananya",
  "Karan",
  "Neha",
  "Arjun",
  "Sneha",
];

const LAST_NAMES = [
  "Sharma",
  "Patel",
  "Singh",
  "Gupta",
  "Mehta",
  "Reddy",
  "Nair",
  "Iyer",
  "Das",
  "Kapoor",
];

const INVITE_STATUSES = ["Invited", "Not Invited", "Opened", "Completed"];
const MESSAGES = [
  "",
  "Reminder sent",
  "Opened invite",
  "Completed survey",
  "Pending verification",
];

/**
 * @param {number} count
 * @returns {import('../types').FindUserRecord[]}
 */
export function generateFindUserRecords(count = 48) {
  return Array.from({ length: count }, (_, idx) => {
    const first = FIRST_NAMES[idx % FIRST_NAMES.length];
    const last = LAST_NAMES[(idx + 3) % LAST_NAMES.length];
    const slug = `${first}.${last}`.toLowerCase();

    return {
      id: `FU-${10001 + idx}`,
      name: `${first} ${last}`,
      email: `${slug}${idx}@example.com`,
      mobile: `+91 ${90000 + idx}${String(idx).padStart(2, "0")}`,
      preScreenCompleted: idx % 3 === 0 ? "No" : "Yes",
      joiningDate: `${String(1 + (idx % 28)).padStart(2, "0")}/02/2026`,
      inviteStatus: INVITE_STATUSES[idx % INVITE_STATUSES.length],
      earnedPoints: (idx % 7) * 25 + 50,
      message: MESSAGES[idx % MESSAGES.length],
      status: idx % 5 === 0 ? "Inactive" : "Active",
    };
  });
}

/** @type {import('../types').FindUserRecord[]} */
export const ALL_FIND_USER_RECORDS = generateFindUserRecords(48);

export const INVITED_USERS_DEMO = ALL_FIND_USER_RECORDS.filter(
  (r) => r.inviteStatus !== "Not Invited"
).slice(0, 20);
