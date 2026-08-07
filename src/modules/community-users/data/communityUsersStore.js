/**
 * Local fixture data for Community Users reward logs / listing helpers.
 * TODO(backend): Replace getCommunityUserById / reward log usage with real
 * panelist detail + reward-history APIs, then delete this store.
 */

const STORAGE_KEY = "community-users";

const PROFILING_QUESTIONS = [
  "What is your age?",
  "What is your profession?",
  "What is your household income?",
  "Which country do you live in?",
  "How often do you participate in surveys?",
  "What is your highest education level?",
  "Do you own a vehicle?",
  "What is your preferred language?",
];

const PROFESSIONS = [
  "Software Engineer",
  "Teacher",
  "Healthcare Worker",
  "Student",
  "Marketing Manager",
  "Accountant",
  "Retail Associate",
  "Freelancer",
];

const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55+"];

function buildProfilingAnswers(seed) {
  return PROFILING_QUESTIONS.map((question) => {
    if (question.includes("age")) {
      return { question, answerOpted: AGE_RANGES[seed % AGE_RANGES.length] };
    }
    if (question.includes("profession")) {
      return { question, answerOpted: PROFESSIONS[seed % PROFESSIONS.length] };
    }
    if (question.includes("income")) {
      return { question, answerOpted: seed % 2 === 0 ? "$50,000 - $75,000" : "$75,000 - $100,000" };
    }
    if (question.includes("country")) {
      return { question, answerOpted: seed % 3 === 0 ? "India" : seed % 3 === 1 ? "United States" : "United Kingdom" };
    }
    if (question.includes("often")) {
      return { question, answerOpted: seed % 2 === 0 ? "Weekly" : "Monthly" };
    }
    if (question.includes("education")) {
      return { question, answerOpted: seed % 2 === 0 ? "Bachelor's Degree" : "Master's Degree" };
    }
    if (question.includes("vehicle")) {
      return { question, answerOpted: seed % 2 === 0 ? "Yes" : "No" };
    }
    return { question, answerOpted: seed % 2 === 0 ? "English" : "Hindi" };
  });
}

import { resolveProfileImageUrl } from "../../shared/utils/userAvatar";
import { buildRewardLogs } from "../utils/rewardLogUtils";

function generateInitialUsers() {
  const firstNames = [
    "John",
    "Jane",
    "Tsholofelo",
    "Priya",
    "Michael",
    "Sarah",
    "David",
    "Emily",
    "Raj",
    "Aisha",
    "Carlos",
    "Emma",
    "Liam",
    "Olivia",
    "Noah",
    "Sophia",
    "Ethan",
    "Mia",
    "Lucas",
    "Amelia",
  ];
  const lastNames = [
    "Doe",
    "Smith",
    "Pooe",
    "Sharma",
    "Johnson",
    "Williams",
    "Brown",
    "Davis",
    "Patel",
    "Khan",
    "Garcia",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Walker",
  ];

  return Array.from({ length: 24 }, (_, index) => {
    const first = firstNames[index % firstNames.length];
    const last = lastNames[(index + 2) % lastNames.length];
    const slug = `${first}.${last}`.toLowerCase().replace(/\s/g, "");
    const id = 12034 + index;
    const rewardPoints = 100 + (index % 8) * 50;

    return {
      id,
      name: `${first} ${last}`,
      emailAddress: `${slug}${index}@example.com`,
      mobileNumber: index % 4 === 0 ? "" : `+1 555 ${String(1000 + index).slice(-4)}`,
      status: index % 6 === 0 ? "Inactive" : "Active",
      prescreenCompleted: index % 5 === 0 ? "No" : "Yes",
      emailVerified: index % 4 === 0 ? "No" : "Yes",
      rewardPoints,
      joiningDate: `${String(1 + (index % 28)).padStart(2, "0")} Jan 2026`,
      ipAddress: `192.${(index % 200) + 10}.xxx.xxx`,
      profilingAnswers: buildProfilingAnswers(index),
      rewardLogs: buildRewardLogs(id, index),
    };
  });
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return generateInitialUsers();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return generateInitialUsers();
    return parsed;
  } catch {
    return generateInitialUsers();
  }
}

function writeStore(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function loadCommunityUsers() {
  return readStore();
}

export function getCommunityUserById(id) {
  const normalized = String(id ?? "").trim();
  return readStore().find((user) => String(user.id) === normalized) ?? null;
}

export function saveCommunityUser(user) {
  const list = readStore();
  const next = list.map((item) => (String(item.id) === String(user.id) ? { ...item, ...user } : item));
  writeStore(next);
  return user;
}

export function deleteCommunityUser(id) {
  const normalized = String(id ?? "").trim();
  const next = readStore().filter((user) => String(user.id) !== normalized);
  writeStore(next);
}

export function updateCommunityUserStatus(id, status) {
  const user = getCommunityUserById(id);
  if (!user) return null;
  return saveCommunityUser({ ...user, status });
}

export function toListingRow(user) {
  const imageUrl = resolveProfileImageUrl(user);
  return {
    id: user.id,
    name: user.name,
    emailAddress: user.emailAddress,
    mobileNumber: user.mobileNumber || "—",
    status: user.status,
    prescreenCompleted: user.prescreenCompleted,
    emailVerified: user.emailVerified ?? "Yes",
    rewardPoints: user.rewardPoints,
    joiningDate: user.joiningDate,
    ipAddress: user.ipAddress,
    imageUrl,
    profile_image: user.profile_image ?? user.profileImage ?? imageUrl ?? undefined,
    profileImage: user.profileImage ?? user.profile_image ?? imageUrl ?? undefined,
  };
}
