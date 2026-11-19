/**
 * PLACEHOLDER onboarding artwork, generated with GPT image generation (prompts in assets/_prompts/).
 * Full-size PNG masters live in assets/_masters/ (not bundled).
 */

/** App icon variants, one per guide; the splash alternates them each launch (owner, BACKLOG #15). */
export const splashIcons = [
  require('../../../assets/brand/placeholder-app-icon-explorer.webp'),
  require('../../../assets/brand/placeholder-app-icon-navigator.webp'),
] as const;
export const SPLASH_ICON_COUNT = splashIcons.length;

/** Renaissance explorer-cartographer: 3-frame wave (Age screen; owner, BACKLOG #21). */
export const guideExplorer = {
  wave: [
    require('../../../assets/characters/placeholder-guide-explorer-wave-a.webp'),
    require('../../../assets/characters/placeholder-guide-explorer-wave-b.webp'),
    require('../../../assets/characters/placeholder-guide-explorer-wave-c.webp'),
  ],
} as const;

/** Navigator-interpreter: 3-frame point (Language screen + Settings; owner, BACKLOG #23–24). */
export const guideNavigator = {
  point: [
    require('../../../assets/characters/placeholder-guide-navigator-point-a.webp'),
    require('../../../assets/characters/placeholder-guide-navigator-point-b.webp'),
    require('../../../assets/characters/placeholder-guide-navigator-point-c.webp'),
  ],
} as const;

/** Owner's splash video (BACKLOG #28): silent 720p re-encodes; original in assets/_masters/splashScreen.mp4. */
export const splashVideo = {
  full: require('../../../assets/video/splash-full.mp4'),
  short: require('../../../assets/video/splash-short.mp4'),
} as const;
