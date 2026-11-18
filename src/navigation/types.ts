import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Splash: { next: 'Age' | 'Map' };
  Age: undefined;
  Language: { onboarding: boolean };
  Map: undefined;
  Continent: { continent: string };
  StoryCard: { slug: string };
  Reader: { slug: string };
  ChapterBreak: { slug: string; chapter: number };
  End: { slug: string };
  Passport: undefined;
  Settings: undefined;
  Paywall: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
