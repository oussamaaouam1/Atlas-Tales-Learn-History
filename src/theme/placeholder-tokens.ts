/**
 * PLACEHOLDER design tokens (BUILD_GUIDE §17).
 * Neutral palette, 8-pt spacing, radius 12. Replaced by the Claude Design output;
 * keep the token names stable so screens do not change.
 */
export const placeholderTokens = {
  color: {
    background: '#FBF8F2',
    surface: '#FFFFFF',
    surfaceMuted: '#F1ECE2',
    border: '#E2DACB',
    text: '#1F2430',
    textMuted: '#5D6472',
    textOnPrimary: '#FFFFFF',
    primary: '#2F6FDE',
    primaryPressed: '#2459B5',
    secondary: '#E8A33D',
    success: '#2E9D6A',
    danger: '#D2493F',
    ocean: '#9CC9E8',
    land: '#E7D7A8',
    overlay: 'rgba(20, 24, 32, 0.45)',
  },
  spacing: { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 12, lg: 20, pill: 999 },
  fontSize: { caption: 13, body: 16, bodyLarge: 18, title: 22, display: 30 },
  lineHeight: { caption: 18, body: 24, bodyLarge: 27, title: 30, display: 38 },
  fontWeight: { regular: '400', bold: '700' },
  // Font family names registered in useAppFonts(). `null` = platform system font.
  fontFamily: {
    arabicRegular: 'Cairo_400Regular',
    arabicBold: 'Cairo_700Bold',
    latinRegular: null,
    latinBold: null,
  },
  shadow: {
    card: {
      shadowColor: '#000000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
  },
} as const;
