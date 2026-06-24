import { useEffect, useMemo, useState } from "react";
import { AVATAR_SIZE } from "./avatarConstants";
import {
  getUserInitials,
  getValidImageUrl,
  splitFullName,
} from "../../modules/shared/utils/userAvatar";

/**
 * Global profile avatar — image with fallback initials (null, empty, or broken URL).
 *
 * @param {{
 *   imageUrl?: string | null,
 *   firstName?: string,
 *   lastName?: string,
 *   name?: string,
 *   size?: keyof typeof AVATAR_SIZE,
 *   className?: string,
 *   alt?: string,
 * }} props
 */
function Avatar({
  imageUrl,
  firstName = "",
  lastName = "",
  name = "",
  size = "header",
  className = "",
  alt = "",
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const { resolvedUrl, initials, label } = useMemo(() => {
    const hasParts = Boolean(firstName?.trim() || lastName?.trim());
    const parsed = hasParts
      ? { firstName: firstName.trim(), lastName: lastName.trim() }
      : splitFullName(name);

    const f = parsed.firstName;
    const l = parsed.lastName;

    return {
      resolvedUrl: getValidImageUrl(imageUrl),
      initials: getUserInitials(f, l),
      label: alt || [f, l].filter(Boolean).join(" ") || name?.trim() || "Profile",
    };
  }, [imageUrl, firstName, lastName, name, alt]);

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedUrl]);

  const showImage = Boolean(resolvedUrl) && !imageFailed;
  const sizeConfig = AVATAR_SIZE[size] ?? AVATAR_SIZE.header;
  const px = sizeConfig.px;

  const baseClass = `relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${sizeConfig.className}`;

  if (showImage) {
    return (
      <img
        src={resolvedUrl}
        alt={label}
        width={px}
        height={px}
        className={`${baseClass} object-cover ${className}`.trim()}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span
      className={`admin-avatar-fallback font-semibold ${baseClass} ${className}`.trim()}
      role="img"
      aria-label={`${initials} avatar`}
    >
      {initials}
    </span>
  );
}

export default Avatar;
