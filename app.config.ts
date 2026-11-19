import type { ExpoConfig } from 'expo/config';
import { version } from './package.json';

// EAS project ID: paste the ID printed by `eas init` here (it is not a secret).
const EAS_PROJECT_ID: string = 'feb6768c-fb2b-43ad-bb15-d43bf4a45f7e';

const BUNDLE_ID = 'com.motkan.atlastales';

const config: ExpoConfig = {
  name: 'Atlas Tales',
  owner: 'motkan',
  slug: 'atlas-tales',
  scheme: 'atlastales',
  version,
  orientation: 'landscape', // owner decision 2026-11-18: whole app landscape (full-screen story images)
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  // Status bar hidden from launch (the app also hides it at runtime).
  androidStatusBar: { hidden: true, translucent: true },
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UIStatusBarHidden: true,
    },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    // RTL: allow right-to-left layout; the app switches with I18nManager.forceRTL (BUILD_GUIDE §8).
    ['expo-localization', { supportsRTL: true, forcesRTL: false }],
    // Narration only: no recording, no microphone permission. Background playback for Pro (§7.2).
    [
      'expo-audio',
      {
        microphonePermission: false,
        recordAudioAndroid: false,
        enableBackgroundPlayback: true,
      },
    ],
    'expo-secure-store',
    'expo-font',
    'expo-image',
  ],
  updates: EAS_PROJECT_ID ? { url: `https://u.expo.dev/${EAS_PROJECT_ID}` } : undefined,
  runtimeVersion: { policy: 'appVersion' },
  extra: {
    // Expo Go reads RTL support from the manifest, not from the expo-localization plugin.
    supportsRTL: true,
    eas: EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : undefined,
  },
};

export default config;
