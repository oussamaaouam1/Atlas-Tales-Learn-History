import { fireEvent, render, screen } from '@testing-library/react-native';
import { I18nManager } from 'react-native';

import { LanguageProvider } from '../providers/LanguageProvider';
import { AppText } from './AppText';
import { Button } from './Button';
import { DirectionalIcon } from './DirectionalIcon';

describe('Button', () => {
  test('renders its label and handles presses', async () => {
    const onPress = jest.fn();
    await render(<Button label="Continue" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('does not fire when disabled or loading', async () => {
    const onPress = jest.fn();
    await render(
      <>
        <Button label="Disabled" disabled onPress={onPress} />
        <Button label="Loading" loading onPress={onPress} />
      </>,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Disabled' }));
    fireEvent.press(screen.getByRole('button', { name: 'Loading' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  test('renders an Arabic label with the Arabic font', async () => {
    await render(
      <LanguageProvider initialLanguage="ar">
        <Button label="متابعة" />
      </LanguageProvider>,
    );
    expect(screen.getByText('متابعة')).toHaveStyle({ fontFamily: 'BalooBhaijaan2_700Bold', writingDirection: 'rtl' });
  });
});

describe('AppText', () => {
  test('uses Baloo 2 at the body weight for Latin languages', async () => {
    await render(
      <LanguageProvider initialLanguage="fr">
        <AppText>Bonjour</AppText>
      </LanguageProvider>,
    );
    expect(screen.getByText('Bonjour')).toHaveStyle({ fontFamily: 'Baloo2_500Medium' });
    expect(screen.getByText('Bonjour')).toHaveStyle({ writingDirection: 'ltr' });
  });
});

describe('DirectionalIcon', () => {
  const original = I18nManager.isRTL;
  afterEach(() => {
    Object.defineProperty(I18nManager, 'isRTL', { value: original, configurable: true });
  });

  test('forward points right in left-to-right layouts', async () => {
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });
    await render(<DirectionalIcon direction="forward" />);
    expect(screen.getByTestId('chevron-right')).toBeTruthy();
  });

  test('forward points left in right-to-left layouts', async () => {
    Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });
    await render(<DirectionalIcon direction="forward" />);
    expect(screen.getByTestId('chevron-left')).toBeTruthy();
  });
});
