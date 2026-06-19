import {
  deleteCommunityUser,
  getCommunityUserById,
  loadCommunityUsers,
  saveCommunityUser,
  toListingRow,
  updateCommunityUserStatus,
} from "../data/communityUsersStore";
import { normalizeSearchQuery } from "../../shared/utils/searchQuery";
import { normalizeRewardLogEntry } from "../utils/rewardLogUtils";

function matchesSearch(user, search) {
  if (!search) return true;
  const query = search.toLowerCase();
  return (
    String(user.name ?? "").toLowerCase().includes(query) ||
    String(user.emailAddress ?? "").toLowerCase().includes(query) ||
    String(user.mobileNumber ?? "").toLowerCase().includes(query) ||
    String(user.id ?? "").includes(query)
  );
}

function matchesFilters(user, filters = {}) {
  if (filters.status && filters.status !== "all") {
    const expected = filters.status === "active" ? "Active" : "Inactive";
    if (user.status !== expected) return false;
  }
  if (filters.prescreenCompleted && filters.prescreenCompleted !== "all") {
    const expected = filters.prescreenCompleted === "yes" ? "Yes" : "No";
    if (user.prescreenCompleted !== expected) return false;
  }
  return true;
}

/**
 * @param {{ page?: number, limit?: number, search?: string, filters?: { status?: string, prescreenCompleted?: string } }} params
 */
export async function getRecords({ page = 1, limit = 10, search, filters } = {}) {
  const normalizedSearch = normalizeSearchQuery(search);
  const allUsers = loadCommunityUsers()
    .filter((user) => matchesSearch(user, normalizedSearch))
    .filter((user) => matchesFilters(user, filters));

  const total = allUsers.length;
  const start = (page - 1) * limit;
  const items = allUsers.slice(start, start + limit).map(toListingRow);

  return { items, total, count: total };
}

export async function getUserProfilingAnswers(userId, { page = 1, limit = 10, search } = {}) {
  const user = getCommunityUserById(userId);
  if (!user) {
    return { items: [], total: 0, count: 0, user: null };
  }

  const normalizedSearch = normalizeSearchQuery(search).toLowerCase();
  const answers = (user.profilingAnswers ?? []).filter((entry) => {
    if (!normalizedSearch) return true;
    return (
      String(entry.question ?? "").toLowerCase().includes(normalizedSearch) ||
      String(entry.answerOpted ?? "").toLowerCase().includes(normalizedSearch)
    );
  });

  const total = answers.length;
  const start = (page - 1) * limit;
  const items = answers.slice(start, start + limit).map((entry, index) => ({
    id: `${userId}-qa-${start + index + 1}`,
    question: entry.question,
    answerOpted: entry.answerOpted,
  }));

  return { items, total, count: total, user };
}

export async function getUserRewardLogs(
  userId,
  { page = 1, limit = 10, search, filters } = {}
) {
  const user = getCommunityUserById(userId);
  if (!user) {
    return { items: [], total: 0, count: 0, user: null };
  }

  const normalizedSearch = normalizeSearchQuery(search).toLowerCase();
  const logs = (user.rewardLogs ?? [])
    .map((entry, index) => normalizeRewardLogEntry(entry, index))
    .filter(Boolean)
    .filter((entry) => {
      if (filters?.reason && filters.reason !== "all" && entry.reason !== filters.reason) {
        return false;
      }
      if (filters?.pointsType === "credit" && entry.pointsValue <= 0) {
        return false;
      }
      if (filters?.pointsType === "debit" && entry.pointsValue >= 0) {
        return false;
      }
      if (!normalizedSearch) return true;
      return (
        String(entry.id ?? "").includes(normalizedSearch) ||
        String(entry.rewardPoints ?? "").toLowerCase().includes(normalizedSearch) ||
        String(entry.reason ?? "").toLowerCase().includes(normalizedSearch) ||
        String(entry.date ?? "").toLowerCase().includes(normalizedSearch)
      );
    });

  const total = logs.length;
  const start = (page - 1) * limit;
  const items = logs.slice(start, start + limit).map((entry) => ({
    id: entry.id,
    rewardPoints: entry.rewardPoints,
    reason: entry.reason,
    date: entry.date,
  }));

  return { items, total, count: total, user };
}

export async function updateRecord(id, payload) {
  const existing = getCommunityUserById(id);
  if (!existing) {
    throw new Error("User not found.");
  }
  saveCommunityUser({ ...existing, ...payload });
  return { message: "User updated successfully." };
}

export async function deleteRecord(id) {
  deleteCommunityUser(id);
  return { message: "User deleted successfully." };
}

export async function updateStatus(id, status) {
  const updated = updateCommunityUserStatus(id, status);
  if (!updated) {
    throw new Error("User not found.");
  }
  return { message: "User status updated successfully." };
}
