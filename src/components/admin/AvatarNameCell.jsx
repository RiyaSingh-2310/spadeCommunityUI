import ProfileAvatar from "../shared/ProfileAvatar";
import { getUserDisplayName } from "../../modules/shared/utils/userAvatar";

function AvatarNameCell({ name, image, firstName, lastName, imageUrl }) {
  const resolvedFirst =
    firstName?.trim() ||
    (name?.trim() ? name.trim().split(/\s+/)[0] : "");
  const resolvedLast =
    lastName?.trim() ||
    (name?.trim()
      ? name.trim().split(/\s+/).slice(1).join(" ")
      : "");
  const displayName = getUserDisplayName(resolvedFirst, resolvedLast, name);
  const resolvedImageUrl = imageUrl ?? image;

  return (
    <div className="flex min-w-0 max-w-full items-center gap-2.5">
      <ProfileAvatar
        imageUrl={resolvedImageUrl}
        firstName={resolvedFirst}
        lastName={resolvedLast}
        size="xs"
        alt={displayName}
      />
      <span className="admin-text min-w-0 truncate">{displayName}</span>
    </div>
  );
}

export default AvatarNameCell;
