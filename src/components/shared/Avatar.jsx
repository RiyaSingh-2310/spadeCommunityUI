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

  const { resolvedFirst, resolvedLast, validUrl, initials, label } = useMemo(() => {
    const hasParts = Boolean(firstName?.trim() || lastName?.trim());
    const parsed = hasParts
      ? { firstName: firstName.trim(), lastName: lastName.trim() }
      : splitFullName(name);

    const f = parsed.firstName;
    const l = parsed.lastName;
    const url = getValidImageUrl(imageUrl);

    return {
      resolvedFirst: f,
      resolvedLast: l,
      validUrl: url,
      initials: getUserInitials(f, l),
      label: alt || [f, l].filter(Boolean).join(" ") || name?.trim() || "Profile",
    };
  }, [imageUrl, firstName, lastName, name, alt]);

  const showImage = Boolean(validUrl) && !imageFailed;
  const sizeConfig = AVATAR_SIZE[size] ?? AVATAR_SIZE.header;
  const px = sizeConfig.px;

  useEffect(() => {
    setImageFailed(false);
  }, [validUrl]);

  const baseClass = `relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${sizeConfig.className}`;

  if (showImage) {
    return (
      <img
        src={validUrl}
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
