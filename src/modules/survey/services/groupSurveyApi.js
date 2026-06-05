export async function createGroupSurveyProject(groupId, form) {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return {
    success: true,
    message: "Survey project added successfully.",
    data: { groupId, ...form },
  };
}

export async function updateGroupSurveyProject(groupId, form) {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return {
    success: true,
    message: "Survey project updated successfully.",
    data: { groupId, ...form },
  };
}
