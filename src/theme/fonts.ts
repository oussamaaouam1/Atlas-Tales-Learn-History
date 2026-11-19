import {
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/baloo-2';
import {
  BalooBhaijaan2_500Medium,
  BalooBhaijaan2_600SemiBold,
  BalooBhaijaan2_700Bold,
  BalooBhaijaan2_800ExtraBold,
} from '@expo-google-fonts/baloo-bhaijaan-2';

/** Loads the design fonts at startup. Returns true when ready (or failed: we fall back to system fonts). */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Baloo2_500Medium,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    BalooBhaijaan2_500Medium,
    BalooBhaijaan2_600SemiBold,
    BalooBhaijaan2_700Bold,
    BalooBhaijaan2_800ExtraBold,
  });
  return loaded || error != null;
}
