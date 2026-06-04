import Avatar from "../shared/Avatar";
import {
  getUserDisplayName,
  resolveAvatarFromRecord,
} from "../../modules/shared/utils/userAvatar";

/**
 * Table cell: avatar + display name (uses global Avatar system).
 */
function AvatarNameCell({ name, image, firstName, lastName, imageUrl, record, size = "table" }) {
  const resolved = record
    ? resolveAvatarFromRecord(record)
    : resolveAvatarFromRecord({
        name,
        firstName,
        lastName,
        imageUrl: imageUrl ?? image,
        image,
      });

  const displayName = resolved.displayName || getUserDisplayName("", "", name);

  return (
    <div className="flex min-w-0 max-w-full items-center gap-2.5">
      <Avatar
        imageUrl={resolved.imageUrl}
        firstName={resolved.firstName}
        lastName={resolved.lastName}
        size={size}
        alt={displayName}
      />
      <span className="admin-text min-w-0 truncate">{displayName}</span>
    </div>
  );
}

export default AvatarNameCell;
