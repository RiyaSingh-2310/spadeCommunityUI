export function getGroupProjectsPath(groupId) {
  return `/survey/group/${encodeURIComponent(groupId)}/projects`;
}

export function getGroupProjectViewPath(groupId, surveyId) {
  return `/survey/group/${encodeURIComponent(groupId)}/projects/view/${encodeURIComponent(surveyId)}`;
}

export function getGroupProjectFindUserPath(groupId, surveyId) {
  return `/survey/group/${encodeURIComponent(groupId)}/projects/${encodeURIComponent(surveyId)}/find-user`;
}

export function getGroupProjectUserSurveyDataPath(groupId, surveyId) {
  return `/survey/group/${encodeURIComponent(groupId)}/projects/${encodeURIComponent(surveyId)}/user-survey-data`;
}

export function getGroupProjectEditPath(surveyId, groupId) {
  return {
    pathname: `/survey/edit/${encodeURIComponent(surveyId)}`,
    state: { returnTo: getGroupProjectsPath(groupId) },
  };
}

/**
 * @param {string|number} groupId
 * @param {{ currentLabel?: string, projectsLabel?: string }} [options]
 */
export function getGroupSurveyBreadcrumbs(groupId, options = {}) {
  const { currentLabel, projectsLabel = "View Projects" } = options;
  const breadcrumbs = [
    { label: "Group Survey", to: "/survey/group" },
    { label: projectsLabel, to: getGroupProjectsPath(groupId) },
  ];

  if (currentLabel) {
    breadcrumbs.push({ label: currentLabel });
  }

  return breadcrumbs;
}
