import { Cairo_400Regular, Cairo_700Bold, useFonts } from '@expo-google-fonts/cairo';

/** Loads the app fonts at startup. Returns true when ready (or failed: we fall back to system fonts). */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({ Cairo_400Regular, Cairo_700Bold });
  return loaded || error != null;
}
