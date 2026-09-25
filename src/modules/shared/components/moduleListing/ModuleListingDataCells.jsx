import { Fragment } from "react";
import { ExternalLink } from "lucide-react";
import AvatarNameCell from "../../../../components/admin/AvatarNameCell";
import Avatar from "../../../../components/shared/Avatar";
import { resolveAvatarFromRecord } from "../../utils/userAvatar";
import StatusToggle from "../../../../components/admin/StatusToggle";
import ViewActionButton from "../../../../components/admin/ViewActionButton";
import TableStatusSelect from "../../../../components/admin/TableStatusSelect";
import RfqStatusBadge from "../../../sales/components/RfqStatusBadge";
import {
  getColumnKey,
  getColumnEllipsisMaxWidthPx,
  getEllipsisCellClassName,
  getEllipsisCellStyle,
  getRowValue,
  isActionColumn,
  isDetailsColumn,
  isNowrapDataColumn,
  isIdColumn,
  isDescriptionColumn,
  isProfileImageColumn,
  isSnoColumn,
  isCheckboxColumn,
} from "../../utils/tableHelpers";
import { formatDescriptionForLineClamp } from "./moduleListingUtils";
import ModuleListingActionCell from "./ModuleListingActionCell";
import TableEllipsisText from "../../../../components/admin/TableEllipsisText";

/**
 * Renders all data cells for one listing row (excluding expand control).
 */
function ModuleListingDataCells({
  row,
  globalIdx,
  tableColumns,
  rowId,
  rowIdKey,
  renderCheckboxCell,
  showStatus,
  rfq,
  renderStatus,
  effectiveStatusAsText,
  formatStatusDisplay,
  statusColumnClass,
  statusDropdownOptions,
  allowWrite,
  allowDownload = false,
  isDarkMode,
  onStatusChange,
  setInternalData,
  effectiveStatusToggle,
  compactStatusColumn,
  allowRead,
  onView,
  actionVariant,
  readOnlyListingActions,
  listingReadMode,
  communityUser,
  groupSurveyProjects,
  userMgmtActions,
  canShowEdit,
  canShowDelete,
  canShowManagePermissions,
  editPath,
  showDeleteAction,
  canDeleteRow,
  onEdit,
  onDelete,
  onManagePermissions,
  onFindUser,
  onUserSurveyData,
  onSurveyClone,
  onProjectUrlInfo,
  onClone,
  onCopy,
  onPdfDownload,
  onApprove,
  onReject,
  onAddProject,
  onListProjects,
  onAddLog,
  onViewLogs,
  onRewardLog,
  onResendEmail,
  onDownload,
  surveyActionLabels,
  handleEdit,
  handleDeleteRequest,
  hasProfileImageColumn,
  nameAsText,
  nowrapAllCells,
  descriptionMaxLines,
}) {
  return tableColumns.map((col) => {
    if (isCheckboxColumn(col)) {
      return <Fragment key="row-select">{renderCheckboxCell(rowId)}</Fragment>;
    }
    const key = getColumnKey(col);
    if (isSnoColumn(col)) {
      return (
        <td key={col} className="px-4 py-3 align-middle whitespace-nowrap">
          <span className="admin-text">{globalIdx + 1}</span>
        </td>
      );
    }
    if (isIdColumn(col)) {
      return (
        <td key={col} className="px-4 py-3 align-middle whitespace-nowrap">
          <span className="admin-text">{row.id ?? row[rowIdKey] ?? "-"}</span>
        </td>
      );
    }
    if (isProfileImageColumn(col)) {
      const avatar = resolveAvatarFromRecord(row);
      return (
        <td key={col} className="px-4 py-3 align-middle whitespace-nowrap">
          <Avatar
            imageUrl={avatar.imageUrl}
            firstName={avatar.firstName}
            lastName={avatar.lastName}
            size="table"
            alt={avatar.displayName}
          />
        </td>
      );
    }
    if (key === "status" && showStatus && rfq) {
      const displayStatus = row.statusRaw ?? row.status;
      return (
        <td
          key={col}
          className={`admin-table-status-col px-4 py-3 align-middle whitespace-nowrap ${statusColumnClass}`}
        >
          <RfqStatusBadge status={displayStatus} />
        </td>
      );
    }
    if (key === "status" && showStatus && typeof renderStatus === "function") {
      return (
        <td key={col} className="px-4 py-3 align-middle whitespace-nowrap">
          {renderStatus(row)}
        </td>
      );
    }
    if (key === "status" && showStatus && effectiveStatusAsText) {
      return (
        <td key={col} className="px-4 py-3 align-middle whitespace-nowrap">
          <span className="admin-text">{formatStatusDisplay(row)}</span>
        </td>
      );
    }
    if (
      key === "status" &&
      showStatus &&
      Array.isArray(statusDropdownOptions) &&
      statusDropdownOptions.length > 0
    ) {
      const currentStatus = String(row.status ?? "").trim();
      return (
        <td
          key={col}
          className={`admin-table-status-col admin-table-status-col-dropdown px-4 py-3 align-middle ${statusColumnClass}`}
        >
          <TableStatusSelect
            value={currentStatus}
            options={statusDropdownOptions}
            disabled={!allowWrite}
            isDarkMode={isDarkMode}
            aria-label="Reward request status"
            onChange={(nextStatus) => {
              if (nextStatus === currentStatus) return;
              if (onStatusChange) {
                onStatusChange(row, nextStatus, globalIdx);
                return;
              }
              setInternalData((prev) =>
                prev.map((item) => {
                  const matches =
                    (row.id && item.id === row.id) ||
                    (row[rowIdKey] && item[rowIdKey] === row[rowIdKey]) ||
                    item === row;
                  if (!matches) return item;
                  return { ...item, status: nextStatus };
                })
              );
            }}
          />
        </td>
      );
    }
    if (key === "status" && showStatus && !effectiveStatusAsText) {
      return (
        <td
          key={col}
          className={`admin-table-status-col px-3 py-3 align-middle ${statusColumnClass}`}
        >
          <StatusToggle
            checked={String(row.status || "").toLowerCase() === "active"}
            readOnly={!allowWrite}
            compact={compactStatusColumn}
            onChange={
              allowWrite
                ? () => {
                    if (effectiveStatusToggle) {
                      effectiveStatusToggle(row, globalIdx);
                      return;
                    }
                    setInternalData((prev) =>
                      prev.map((item) => {
                        const matches =
                          (row.id && item.id === row.id) ||
                          (row[rowIdKey] && item[rowIdKey] === row[rowIdKey]) ||
                          item === row;
                        if (!matches) return item;
                        return {
                          ...item,
                          status:
                            String(item.status).toLowerCase() === "active"
                              ? "Inactive"
                              : "Active",
                        };
                      })
                    );
                  }
                : undefined
            }
          />
        </td>
      );
    }
    if (isDetailsColumn(col)) {
      return (
        <td key={col} className="px-4 py-3 align-middle text-right whitespace-nowrap">
          <ViewActionButton
            isDarkMode={isDarkMode}
            onView={allowRead && onView ? () => onView(row, globalIdx) : undefined}
          />
        </td>
      );
    }
    if (isActionColumn(col)) {
      return (
        <ModuleListingActionCell
          key={col}
          col={col}
          isDarkMode={isDarkMode}
          row={row}
          globalIdx={globalIdx}
          actionVariant={actionVariant}
          allowRead={allowRead}
          allowWrite={allowWrite}
          allowDownload={allowDownload}
          readOnlyListingActions={readOnlyListingActions}
          listingReadMode={listingReadMode}
          communityUser={communityUser}
          rfq={rfq}
          groupSurveyProjects={groupSurveyProjects}
          userMgmtActions={userMgmtActions}
          canShowEdit={canShowEdit}
          canShowDelete={canShowDelete}
          canShowManagePermissions={canShowManagePermissions}
          editPath={editPath}
          showDeleteAction={showDeleteAction}
          canDeleteRow={canDeleteRow}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onManagePermissions={onManagePermissions}
          onFindUser={onFindUser}
          onUserSurveyData={onUserSurveyData}
          onSurveyClone={onSurveyClone}
          onProjectUrlInfo={onProjectUrlInfo}
          onClone={onClone}
          onCopy={onCopy}
          onPdfDownload={onPdfDownload}
          onApprove={onApprove}
          onReject={onReject}
          onAddProject={onAddProject}
          onListProjects={onListProjects}
          onAddLog={onAddLog}
          onViewLogs={onViewLogs}
          onRewardLog={onRewardLog}
          onResendEmail={onResendEmail}
          onDownload={onDownload}
          surveyActionLabels={surveyActionLabels}
          handleEdit={handleEdit}
          handleDeleteRequest={handleDeleteRequest}
        />
      );
    }
    if (key === "name") {
      const ellipsisMax = getColumnEllipsisMaxWidthPx(col);
      return (
        <td
          key={col}
          className={getEllipsisCellClassName(
            ellipsisMax,
            `px-4 py-3 align-middle ${nowrapAllCells && !ellipsisMax ? "whitespace-nowrap" : ""}`
          )}
          style={getEllipsisCellStyle(ellipsisMax)}
        >
          {hasProfileImageColumn || nameAsText ? (
            <TableEllipsisText>{row.name || "-"}</TableEllipsisText>
          ) : (
            <AvatarNameCell record={row} size="table" />
          )}
        </td>
      );
    }
    const value = getRowValue(row, col);
    const displayValue =
      value === "" || value === "-" ? (key === "projectid" ? "—" : value) : value;
    if (key === "questionTitle" && onView && allowRead) {
      const titleText = displayValue === "-" ? "—" : String(displayValue);
      const ellipsisMax = getColumnEllipsisMaxWidthPx(col);
      return (
        <td
          key={col}
          className={getEllipsisCellClassName(ellipsisMax, "px-4 py-3 align-middle")}
          style={getEllipsisCellStyle(ellipsisMax)}
        >
          <button
            type="button"
            onClick={() => onView(row, globalIdx)}
            className="admin-table-ellipsis-text admin-text hover:opacity-80"
            title={titleText !== "—" ? titleText : undefined}
          >
            {titleText}
          </button>
        </td>
      );
    }
    if (key === "emailSubject") {
      const subjectText = displayValue === "-" ? "—" : String(displayValue);
      const ellipsisMax = getColumnEllipsisMaxWidthPx(col);
      return (
        <td
          key={col}
          className={getEllipsisCellClassName(ellipsisMax, "px-4 py-3 align-middle")}
          style={getEllipsisCellStyle(ellipsisMax)}
        >
          <TableEllipsisText title={subjectText !== "—" ? subjectText : undefined}>
            {subjectText}
          </TableEllipsisText>
        </td>
      );
    }
    if (key === "websiteUrl" || key === "url") {
      const urlText = displayValue === "-" ? "" : String(displayValue).trim();
      const ellipsisMax = getColumnEllipsisMaxWidthPx(col);
      return (
        <td
          key={col}
          className={getEllipsisCellClassName(ellipsisMax, "px-4 py-3 align-middle")}
          style={getEllipsisCellStyle(ellipsisMax)}
        >
          {urlText && /^https?:\/\//i.test(urlText) ? (
            <a
              href={urlText}
              target="_blank"
              rel="noreferrer noopener"
              className="admin-text inline-flex max-w-full items-center gap-1.5 text-[var(--admin-primary-color)] hover:underline"
              title={urlText}
            >
              <span className="admin-table-ellipsis-text min-w-0">{urlText}</span>
              <ExternalLink size={14} className="shrink-0 opacity-70" aria-hidden />
            </a>
          ) : (
            <TableEllipsisText title={urlText || undefined}>{urlText || "—"}</TableEllipsisText>
          )}
        </td>
      );
    }
    if (isDescriptionColumn(col)) {
      const rawDescription =
        displayValue === "-" || displayValue === "—"
          ? "—"
          : String(displayValue ?? "");
      const isSingleLine = descriptionMaxLines === 1;
      const descriptionText = isSingleLine
        ? rawDescription === "—"
          ? "—"
          : rawDescription.replace(/\s+/g, " ").trim() || "—"
        : formatDescriptionForLineClamp(rawDescription, descriptionMaxLines);
      const descriptionClampClass = isSingleLine
        ? "admin-text block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
        : descriptionMaxLines === 2
          ? "admin-text admin-table-description-line-clamp-2 break-words"
          : "admin-text line-clamp-2 whitespace-pre-wrap break-words";
      return (
        <td
          key={col}
          className={
            isSingleLine
              ? "max-w-[12rem] w-[12rem] overflow-hidden px-4 py-3 align-middle"
              : "max-w-xl px-4 py-3 align-middle"
          }
        >
          <span
            className={descriptionClampClass}
            title={descriptionText !== "—" ? rawDescription : undefined}
          >
            {descriptionText}
          </span>
        </td>
      );
    }
    const ellipsisMax = getColumnEllipsisMaxWidthPx(col);
    return (
      <td
        key={col}
        className={getEllipsisCellClassName(
          ellipsisMax,
          `px-4 py-3 align-middle ${
            !ellipsisMax && (nowrapAllCells || isNowrapDataColumn(col))
              ? "whitespace-nowrap"
              : ""
          }`
        )}
        style={getEllipsisCellStyle(ellipsisMax)}
      >
        {ellipsisMax ? (
          <TableEllipsisText>{displayValue}</TableEllipsisText>
        ) : (
          <span className="admin-text">{displayValue}</span>
        )}
      </td>
    );
  });
}

export default ModuleListingDataCells;
