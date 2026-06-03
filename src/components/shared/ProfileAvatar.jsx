import { useEffect, useState } from "react";
import {
  getUserInitials,
  getValidImageUrl,
} from "../../modules/shared/utils/userAvatar";

const SIZE_CLASSES = {
  xs: "h-9 w-9 text-xs",
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const SIZE_PX = {
  xs: 36,
  sm: 28,
  md: 40,
  lg: 48,
};

/**
 * @param {{
 *   imageUrl?: string | null,
 *   firstName?: string,
 *   lastName?: string,
 *   size?: keyof typeof SIZE_CLASSES,
 *   className?: string,
 *   alt?: string,
 * }} props
 */
function ProfileAvatar({
  imageUrl,
  firstName = "",
  lastName = "",
  size = "md",
  className = "",
  alt = "",
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const validUrl = getValidImageUrl(imageUrl);
  const initials = getUserInitials(firstName, lastName);
  const showImage = Boolean(validUrl) && !imageFailed;
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const px = SIZE_PX[size] ?? SIZE_PX.md;

  useEffect(() => {
    setImageFailed(false);
  }, [validUrl]);

  const baseClass = `relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${sizeClass}`;

  if (showImage) {
    return (
      <img
        src={validUrl}
        alt={alt || `${firstName} ${lastName}`.trim() || "Profile"}
        width={px}
        height={px}
        className={`${baseClass} object-cover ${className}`.trim()}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span
      className={`admin-avatar-fallback font-bold ${baseClass} ${className}`.trim()}
      aria-hidden={!alt}
      role={alt ? "img" : undefined}
      aria-label={alt ? undefined : `${initials} avatar`}
    >
      {initials}
    </span>
  );
}

export default ProfileAvatar;
