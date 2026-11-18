import { render, screen } from '@testing-library/react-native';

import App from '../App';

describe('App shell', () => {
  test('explains when the Convex URL is missing instead of crashing', async () => {
    await render(<App />);
    expect(screen.getByText(/EXPO_PUBLIC_CONVEX_URL is not set/)).toBeTruthy();
  });
});
