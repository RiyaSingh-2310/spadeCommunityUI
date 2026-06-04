/** Centralized avatar dimensions (px) and Tailwind classes */

export const AVATAR_SIZE = {
  /** 32×32 — data tables, compact lists */
  table: {
    px: 32,
    className: "h-8 w-8 text-xs",
  },
  /** 40×40 — header profile, dropdown */
  header: {
    px: 40,
    className: "h-10 w-10 text-sm",
  },
  /** 28×28 — compact header trigger (navbar pill) */
  headerCompact: {
    px: 28,
    className: "h-7 w-7 text-xs",
  },
  /** 60×60 — profile / edit pages */
  profile: {
    px: 60,
    className: "h-[60px] w-[60px] text-base",
  },
  /** 100×100 — profile image upload preview */
  profileLarge: {
    px: 100,
    className: "h-[100px] w-[100px] text-lg",
  },
};

/** @typedef {keyof typeof AVATAR_SIZE} AvatarSizeKey */
