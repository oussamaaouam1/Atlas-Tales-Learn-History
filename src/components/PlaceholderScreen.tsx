import type { ReactNode } from 'react';

import { useLanguage } from '../providers/LanguageProvider';
import { AppText } from './AppText';
import { Card } from './Card';
import { Screen } from './Screen';

/** PLACEHOLDER layout for screens built in later phases. */
export function PlaceholderScreen({ title, children }: { title: string; children?: ReactNode }) {
  const { t } = useLanguage();
  return (
    <Screen scroll narrow edges={['bottom', 'left', 'right']}>
      <AppText variant="title" bold>
        {title}
      </AppText>
      <Card>
        <AppText color="textMuted">{t('common.placeholder')}</AppText>
      </Card>
      {children}
    </Screen>
  );
}
