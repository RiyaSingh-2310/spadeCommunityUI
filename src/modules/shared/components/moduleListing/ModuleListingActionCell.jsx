import CommunityUserListingActions from "../../../../components/admin/CommunityUserListingActions";
import GroupSurveyListingActions from "../../../../components/admin/GroupSurveyListingActions";
import GroupSurveyProjectListingActions from "../../../../components/admin/GroupSurveyProjectListingActions";
import IconActions from "../../../../components/admin/IconActions";
import InvoicePdfAction from "../../../../components/admin/InvoicePdfAction";
import RewardPendingActions from "../../../../components/admin/RewardPendingActions";
import RfqListingActions from "../../../../components/admin/RfqListingActions";
import SurveyListingActions from "../../../../components/admin/SurveyListingActions";
import UserManagementActions from "../../../../components/admin/UserManagementActions";
import ViewActionButton from "../../../../components/admin/ViewActionButton";
import { getUserManagementActionFlags } from "../../../permissions/moduleListingPermissions";

function ModuleListingActionCell({
  col,
  isDarkMode,
  row,
  globalIdx,
  actionVariant,
  allowRead,
  allowWrite,
  readOnlyListingActions,
  listingReadMode,
  communityUser,
  rfq,
  groupSurveyProjects,
  userMgmtActions,
  canShowEdit,
  canShowDelete,
  canShowManagePermissions,
  editPath,
  showDeleteAction,
  onView,
  onEdit,
  onDelete,
  onManagePermissions,
  onFindUser,
  onUserSurveyData,
  onSurveyClone,
  onPdfDownload,
  onApprove,
  onReject,
  onAddProject,
  onListProjects,
  onAddLog,
  onViewLogs,
  onRewardLog,
  surveyActionLabels,
  handleEdit,
  handleDeleteRequest,
}) {
  const cellClass = "px-4 py-3 align-middle text-right whitespace-nowrap";

  if (!allowRead) return null;
  if (!allowWrite && !readOnlyListingActions) return null;

  if (communityUser) {
    const showEdit = allowWrite && Boolean(onEdit || editPath);
    const showDelete = allowWrite && showDeleteAction && Boolean(onDelete);
    const hasCommunityActions =
      (allowRead && onView) || showEdit || showDelete || (allowRead && onRewardLog);

    if (!hasCommunityActions) return null;

    return (
      <td key={col} className={cellClass}>
        <CommunityUserListingActions
        isDarkMode={isDarkMode}
        onView={allowRead && onView ? () => onView(row, globalIdx) : undefined}
        onEdit={showEdit ? () => handleEdit(row, globalIdx) : undefined}
        onDelete={showDelete ? () => handleDeleteRequest(row, globalIdx) : undefined}
        onRewardLog={allowRead && onRewardLog ? () => onRewardLog(row, globalIdx) : undefined}
        showEdit={showEdit}
        showDelete={showDelete}
      />
      </td>
    );
  }

  if (actionVariant === "user-management") {
    const { showEdit, showDelete } =
      userMgmtActions ??
      getUserManagementActionFlags({
        allowWrite,
        onEdit,
        editPath,
        onDelete,
        showDeleteAction,
      });

    if (!showEdit && !showDelete) return null;

    return (
      <td key={col} className={cellClass}>
        <UserManagementActions
        isDarkMode={isDarkMode}
        showManagePermissions={canShowManagePermissions}
        showEdit={showEdit}
        showDelete={showDelete}
        onManagePermissions={
          onManagePermissions ? () => onManagePermissions(row, globalIdx) : undefined
        }
        onEdit={showEdit ? () => handleEdit(row, globalIdx) : undefined}
        onDelete={showDelete ? () => handleDeleteRequest(row, globalIdx) : undefined}
      />
      </td>
    );
  }

  if (rfq) {
    const hasRfqActions =
      (allowWrite && (editPath || onDelete || onAddLog)) || (allowRead && onViewLogs);

    if (!hasRfqActions) return null;

    return (
      <td key={col} className={cellClass}>
        <RfqListingActions
        isDarkMode={isDarkMode}
        onEdit={canShowEdit ? () => handleEdit(row, globalIdx) : undefined}
        onDelete={canShowDelete ? () => handleDeleteRequest(row, globalIdx) : undefined}
        onAddLog={allowWrite && onAddLog ? () => onAddLog(row, globalIdx) : undefined}
        onViewLogs={allowRead && onViewLogs ? () => onViewLogs(row, globalIdx) : undefined}
      />
      </td>
    );
  }

  if (groupSurveyProjects) {
    return (
      <td key={col} className={cellClass}>
        <GroupSurveyProjectListingActions
        isDarkMode={isDarkMode}
        onEdit={allowWrite && canShowEdit ? () => handleEdit(row, globalIdx) : undefined}
        onAddProject={allowWrite && onAddProject ? () => onAddProject(row, globalIdx) : undefined}
        onDelete={canShowDelete ? () => handleDeleteRequest(row, globalIdx) : undefined}
      />
      </td>
    );
  }

  if (actionVariant === "group-survey") {
    const readOnlyGroupSurvey = !allowWrite && listingReadMode === "group-survey-view";
    return (
      <td key={col} className={cellClass}>
        <GroupSurveyListingActions
        isDarkMode={isDarkMode}
        onEdit={!readOnlyGroupSurvey && canShowEdit ? () => handleEdit(row, globalIdx) : undefined}
        onAddProject={
          !readOnlyGroupSurvey && canShowEdit && onAddProject
            ? () => onAddProject(row, globalIdx)
            : undefined
        }
        onListProjects={allowRead && onListProjects ? () => onListProjects(row, globalIdx) : undefined}
      />
      </td>
    );
  }

  if (actionVariant === "view-edit") {
    const useSurveyActions = onFindUser || onUserSurveyData || onSurveyClone;

    if (!allowWrite && onView && !useSurveyActions) {
      return (
        <td key={col} className={cellClass}>
          <ViewActionButton isDarkMode={isDarkMode} onView={() => onView(row, globalIdx)} />
        </td>
      );
    }

    if (!useSurveyActions && !allowWrite) return null;

    return (
      <td key={col} className={cellClass}>
        {useSurveyActions ? (
      <SurveyListingActions
        isDarkMode={isDarkMode}
        onView={allowRead && onView ? () => onView(row, globalIdx) : undefined}
        onEdit={canShowEdit ? () => handleEdit(row, globalIdx) : undefined}
        onFindUser={allowRead && onFindUser ? () => onFindUser(row, globalIdx) : undefined}
        onUserSurveyData={
          allowRead && onUserSurveyData ? () => onUserSurveyData(row, globalIdx) : undefined
        }
        onSurveyClone={allowWrite && onSurveyClone ? () => onSurveyClone(row, globalIdx) : undefined}
        labels={surveyActionLabels}
      />
    ) : (
      <IconActions
        isDarkMode={isDarkMode}
        showDelete={canShowDelete}
        onEdit={canShowEdit ? () => handleEdit(row, globalIdx) : undefined}
        onDelete={canShowDelete ? () => handleDeleteRequest(row, globalIdx) : undefined}
      />
        )}
      </td>
    );
  }

  if (actionVariant === "pdf-download") {
    return (
      <td key={col} className={cellClass}>
        <InvoicePdfAction
        isDarkMode={isDarkMode}
        onDownload={allowRead && onPdfDownload ? () => onPdfDownload(row, globalIdx) : undefined}
      />
      </td>
    );
  }

  if (actionVariant === "reward-pending") {
    return (
      <td key={col} className={cellClass}>
        <RewardPendingActions
        isDarkMode={isDarkMode}
        onView={allowRead && onView ? () => onView(row, globalIdx) : undefined}
        onApprove={allowWrite && onApprove ? () => onApprove(row, globalIdx) : undefined}
        onReject={allowWrite && onReject ? () => onReject(row, globalIdx) : undefined}
      />
      </td>
    );
  }

  if (!allowWrite) return null;

  return (
    <td key={col} className={cellClass}>
      <IconActions
      isDarkMode={isDarkMode}
      showDelete={canShowDelete}
      onEdit={canShowEdit ? () => handleEdit(row, globalIdx) : undefined}
      onDelete={canShowDelete ? () => handleDeleteRequest(row, globalIdx) : undefined}
    />
    </td>
  );
}

export default ModuleListingActionCell;
