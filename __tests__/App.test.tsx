import { render, screen } from '@testing-library/react-native';

import App from '../App';

// This test exits before navigation is mounted and does not need native map worklets.
jest.mock('../src/navigation/RootNavigator', () => ({ RootNavigator: () => null }));

describe('App shell', () => {
  test('explains when the Convex URL is missing instead of crashing', async () => {
    await render(<App />);
    expect(screen.getByText(/EXPO_PUBLIC_CONVEX_URL is not set/)).toBeTruthy();
  });
});
