import * as Updates from 'expo-updates';
import { DevSettings } from 'react-native';

/** Restarts the JS app so a layout-direction change (I18nManager.forceRTL) takes effect. */
export async function reloadApp(): Promise<void> {
  if (__DEV__) {
    // expo-updates cannot reload in development (Expo Go / dev server); DevSettings can.
    DevSettings.reload();
    return;
  }
  await Updates.reloadAsync();
}
