import { render, screen } from '@testing-library/react-native';

import App from '../App';

describe('App shell', () => {
  it('renders the app name', async () => {
    await render(<App />);
    expect(screen.getByText('Atlas Tales')).toBeTruthy();
  });
});
