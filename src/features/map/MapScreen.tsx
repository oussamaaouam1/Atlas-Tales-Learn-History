import { StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { DirectionalIcon } from '../../components/DirectionalIcon';
import { Screen } from '../../components/Screen';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';
import { tokens } from '../../theme/tokens';

/** PLACEHOLDER home. The illustrated map arrives in Phase 3; for now it links to every screen. */
export function MapScreen({ navigation }: RootScreenProps<'Map'>) {
  const { t } = useLanguage();
  const forward = <DirectionalIcon direction="forward" color={tokens.color.primary} />;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <AppText variant="display" bold>
          {t('common.appName')}
        </AppText>
        <AppText color="textMuted">{t('screens.map')}</AppText>
      </View>
      <Card style={styles.mapPlaceholder}>
        <AppText color="textMuted" align="center">
          {t('common.placeholder')}
        </AppText>
      </Card>
      <Button
        label={t('map.openContinent')}
        endIcon={<DirectionalIcon direction="forward" color={tokens.color.textOnPrimary} />}
        onPress={() => navigation.navigate('Continent', { continent: 'africa' })}
      />
      <Button
        variant="secondary"
        label={t('map.openStory')}
        endIcon={forward}
        onPress={() => navigation.navigate('StoryCard', { slug: 'fixture-story' })}
      />
      <Button variant="secondary" label={t('map.openPassport')} endIcon={forward} onPress={() => navigation.navigate('Passport')} />
      <Button variant="secondary" label={t('map.openSettings')} endIcon={forward} onPress={() => navigation.navigate('Settings')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: tokens.spacing.xs },
  mapPlaceholder: {
    height: 180,
    justifyContent: 'center',
    backgroundColor: tokens.color.ocean,
  },
});
