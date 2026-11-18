import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const OWNER_KEY = 'atlas.ownerKey';
const TOKEN_KEY = 'atlas.installToken';

export interface InstallIdentity {
  ownerKey: string;
  installToken: string;
  isNew: boolean;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Anonymous-first identity (BUILD_GUIDE §7.8): `install_<uuid>` + a secret token, kept in SecureStore. */
export async function getOrCreateIdentity(): Promise<InstallIdentity> {
  const [ownerKey, installToken] = await Promise.all([
    SecureStore.getItemAsync(OWNER_KEY),
    SecureStore.getItemAsync(TOKEN_KEY),
  ]);
  if (ownerKey && installToken) return { ownerKey, installToken, isNew: false };

  const created = {
    ownerKey: `install_${Crypto.randomUUID().toLowerCase()}`,
    installToken: bytesToHex(await Crypto.getRandomBytesAsync(32)),
  };
  await SecureStore.setItemAsync(OWNER_KEY, created.ownerKey);
  await SecureStore.setItemAsync(TOKEN_KEY, created.installToken);
  return { ...created, isNew: true };
}
