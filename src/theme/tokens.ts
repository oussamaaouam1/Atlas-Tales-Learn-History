/** Bright Explorer values transcribed from the supplied Round 2 token sheet. */
export const tokens = {
  color: {
    background: '#EEF5FF', surface: '#FFFFFF', surfaceMuted: '#F7FAFF',
    border: '#D6E3FA', text: '#14213D', textMuted: '#4A5878',
    textOnPrimary: '#FFFFFF', primary: '#1C5BD9', primaryPressed: '#1648B0',
    secondary: '#FF7A3D', accent: '#FFC83D', warning: '#FFC83D',
    success: '#17845A', danger: '#C62F2F', pro: '#7A4DD8',
    // Map colours remain provisional until the map artwork is implemented.
    ocean: '#9CC9E8', land: '#E7D7A8', overlay: 'rgba(20, 33, 61, 0.55)',
  },
  spacing: { xxs: 2, xs: 4, sm: 8, medium: 12, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 10, md: 16, lg: 24, pill: 999 },
  fontSize: { caption: 13, body: 16, bodyLarge: 21, title: 24, display: 34 },
  lineHeight: { caption: 18, body: 24, bodyLarge: 31, title: 30, display: 40 },
  arabicFontSize: { caption: 14, body: 17, bodyLarge: 21, title: 26, display: 36 },
  arabicLineHeight: { caption: 22, body: 28, bodyLarge: 35, title: 36, display: 50 },
  fontWeight: { regular: '400', bold: '700' },
  // Typography: Baloo 2 (Latin) + Baloo Bhaijaan 2 (Arabic), weights per text style (Round 2 token sheet).
  fontFamily: {
    arabicRegular: 'BalooBhaijaan2_500Medium', arabicBold: 'BalooBhaijaan2_700Bold',
    latinRegular: 'Baloo2_500Medium', latinBold: 'Baloo2_700Bold',
  },
  fontFace: {
    latin: { 500: 'Baloo2_500Medium', 600: 'Baloo2_600SemiBold', 700: 'Baloo2_700Bold', 800: 'Baloo2_800ExtraBold' },
    arabic: {
      500: 'BalooBhaijaan2_500Medium', 600: 'BalooBhaijaan2_600SemiBold',
      700: 'BalooBhaijaan2_700Bold', 800: 'BalooBhaijaan2_800ExtraBold',
    },
  },
  variantWeight: { caption: 600, body: 500, bodyLarge: 600, title: 800, display: 800 },
  shadow: {
    card: {
      shadowColor: '#1C5BD9', shadowOpacity: 0.16, shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 }, elevation: 3,
    },
  },
} as const;
export type Tokens = typeof tokens;
