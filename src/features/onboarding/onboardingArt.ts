/**
 * PLACEHOLDER onboarding artwork, generated with GPT image generation (prompts in assets/_prompts/).
 * Full-size PNG masters live in assets/_masters/ (not bundled).
 */

/** App icon variants, one per guide; the splash alternates them each launch (owner, BACKLOG #15). */
export const splashIcons = [
  require('../../../assets/brand/placeholder-app-icon-mapmaker.webp'),
  require('../../../assets/brand/placeholder-app-icon-traveller.webp'),
] as const;
export const SPLASH_ICON_COUNT = splashIcons.length;

/** Andalusian map-maker scholar: waving (Age screen). */
export const guideMapmaker = {
  wave: [
    require('../../../assets/characters/placeholder-guide-mapmaker-wave-a.webp'),
    require('../../../assets/characters/placeholder-guide-mapmaker-wave-b.webp'),
  ],
} as const;

/** Silk Road traveller: pointing (Language screen). */
export const guideTraveller = {
  point: [
    require('../../../assets/characters/placeholder-guide-traveller-point-a.webp'),
    require('../../../assets/characters/placeholder-guide-traveller-point-b.webp'),
  ],
} as const;
