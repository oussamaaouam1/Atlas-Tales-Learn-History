import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { bytesToHex, getOrCreateIdentity } from './identity';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  };
});
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => '123E4567-E89B-42D3-A456-426614174000'),
  getRandomBytesAsync: jest.fn(async (n: number) => new Uint8Array(n).fill(171)),
}));

describe('identity', () => {
  test('bytesToHex pads every byte', () => {
    expect(bytesToHex(new Uint8Array([0, 15, 255]))).toBe('000fff');
  });

  test('creates install_<uuid> and a 64-char token once, then reuses them', async () => {
    const first = await getOrCreateIdentity();
    expect(first).toEqual({
      ownerKey: 'install_123e4567-e89b-42d3-a456-426614174000',
      installToken: 'ab'.repeat(32),
      isNew: true,
    });

    const second = await getOrCreateIdentity();
    expect(second).toEqual({ ...first, isNew: false });
    expect(Crypto.randomUUID).toHaveBeenCalledTimes(1);
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);
  });
});
