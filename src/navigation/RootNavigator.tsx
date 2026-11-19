import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ContinentScreen } from '../features/map/ContinentScreen';
import { MapScreen } from '../features/map/MapScreen';
import { StoryCardSheet } from '../features/map/StoryCardSheet';
import { AgeScreen } from '../features/onboarding/AgeScreen';
import { LanguageScreen } from '../features/onboarding/LanguageScreen';
import { SplashScreen } from '../features/onboarding/SplashScreen';
import { PassportScreen } from '../features/passport/PassportScreen';
import { PaywallModal } from '../features/paywall/PaywallModal';
import { ChapterBreakScreen, EndScreen, ReaderScreen } from '../features/reader/ReaderScreens';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { useLanguage } from '../providers/LanguageProvider';
import { tokens } from '../theme/tokens';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: tokens.color.primary,
    background: tokens.color.background,
    card: tokens.color.background,
    text: tokens.color.text,
    border: tokens.color.border,
  },
};

export function RootNavigator({ onboardingComplete }: { onboardingComplete: boolean }) {
  const { t, isRTL, language } = useLanguage();
  const headerFont = language === 'ar' ? tokens.fontFamily.arabicBold : undefined;

  return (
    <NavigationContainer theme={navigationTheme} direction={isRTL ? 'rtl' : 'ltr'}>
      <Stack.Navigator
        screenOptions={{
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          headerTitleStyle: headerFont ? { fontFamily: headerFont } : undefined,
          contentStyle: { backgroundColor: tokens.color.background },
        }}
      >
        <Stack.Group screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 300 }}>
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            initialParams={{ next: onboardingComplete ? 'Map' : 'Age' }}
          />
          <Stack.Screen name="Age" component={AgeScreen} />
          <Stack.Screen name="Language" component={LanguageScreen} initialParams={{ onboarding: true }} />
          <Stack.Screen name="Map" component={MapScreen} />
        </Stack.Group>
        <Stack.Screen name="Continent" component={ContinentScreen} options={{ title: t('screens.continent'), animation: 'fade', headerShown: false }} />
        <Stack.Screen
          name="StoryCard"
          component={StoryCardSheet}
          options={{ headerShown: false, presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }}
        />
        <Stack.Screen name="Reader" component={ReaderScreen} options={{ title: t('screens.reader') }} />
        <Stack.Screen name="ChapterBreak" component={ChapterBreakScreen} options={{ title: t('screens.chapterBreak') }} />
        <Stack.Screen name="End" component={EndScreen} options={{ title: t('screens.end') }} />
        <Stack.Screen name="Passport" component={PassportScreen} options={{ title: t('screens.passport') }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('screens.settings') }} />
        <Stack.Screen
          name="Paywall"
          component={PaywallModal}
          options={{ title: t('screens.paywall'), presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
