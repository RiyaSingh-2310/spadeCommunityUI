/**
 * Temporary User Survey Data mock.
 * Replace with real API when available.
 */

const MOCK_USER_SURVEY_ROWS = [
  {
    id: "U-90021",
    userName: "Anita Sharma",
    startTime: "12 Mar 2026, 11:02 AM",
    endTime: "12 Mar 2026, 11:20 AM",
    points: 50,
    status: "Complete",
  },
  {
    id: "U-90045",
    userName: "Rohan Mehta",
    startTime: "12 Mar 2026, 12:50 PM",
    endTime: "12 Mar 2026, 01:05 PM",
    points: 5,
    status: "Terminate",
  },
  {
    id: "U-90078",
    userName: "Sara Khan",
    startTime: "13 Mar 2026, 09:20 AM",
    endTime: "13 Mar 2026, 09:40 AM",
    points: 0,
    status: "Over Quota",
  },
  {
    id: "U-90102",
    userName: "David Chen",
    startTime: "13 Mar 2026, 03:55 PM",
    endTime: "13 Mar 2026, 04:18 PM",
    points: 55,
    status: "Complete",
  },
  {
    id: "U-90133",
    userName: "Priya Nair",
    startTime: "14 Mar 2026, 09:45 AM",
    endTime: "14 Mar 2026, 10:02 AM",
    points: 0,
    status: "Quality Term",
  },
  {
    id: "U-90150",
    userName: "James Walsh",
    startTime: "14 Mar 2026, 12:20 PM",
    endTime: "14 Mar 2026, 12:45 PM",
    points: 50,
    status: "Complete",
  },
  {
    id: "U-90166",
    userName: "Aya Tanaka",
    startTime: "14 Mar 2026, 02:10 PM",
    endTime: "14 Mar 2026, 02:28 PM",
    points: 45,
    status: "Complete",
  },
  {
    id: "U-90180",
    userName: "Omar Ali",
    startTime: "15 Mar 2026, 10:05 AM",
    endTime: "15 Mar 2026, 10:18 AM",
    points: 5,
    status: "Terminate",
  },
];

/**
 * Placeholder for future User Survey Data API (currently mock).
 * @param {string} surveyId
 * @param {{ query?: string, page?: number, pageSize?: number }} params
 */
export async function fetchUserSurveyData(surveyId, params = {}) {
  void surveyId;
  await new Promise((resolve) => setTimeout(resolve, 220));

  const query = String(params.query ?? "")
    .trim()
    .toLowerCase();
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.max(1, Number(params.pageSize) || 10);

  let rows = MOCK_USER_SURVEY_ROWS.map((row) => ({ ...row }));
  if (query) {
    rows = rows.filter((row) =>
      [row.id, row.userName, row.status, String(row.points)]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);

  return {
    success: true,
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize) || 1),
  };
}
