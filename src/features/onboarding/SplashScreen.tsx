import { useEffect } from 'react';

import { AppText } from '../../components/AppText';
import { Screen } from '../../components/Screen';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';

const SPLASH_MS = 1200; // §6: short brand moment, never more than 2 s

export function SplashScreen({ navigation, route }: RootScreenProps<'Splash'>) {
  const { t } = useLanguage();
  const { next } = route.params;

  useEffect(() => {
    const timer = setTimeout(() => navigation.replace(next), SPLASH_MS);
    return () => clearTimeout(timer);
  }, [navigation, next]);

  return (
    <Screen centered>
      <AppText variant="display" bold align="center">
        {t('common.appName')}
      </AppText>
      <AppText variant="bodyLarge" color="textMuted" align="center">
        {t('splash.tagline')}
      </AppText>
    </Screen>
  );
}
