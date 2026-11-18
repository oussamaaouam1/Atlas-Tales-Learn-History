import { useMutation } from 'convex/react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { api } from '../../convex/_generated/api';
import { version as appVersion } from '../../package.json';
import type { AgeBand } from '../features/onboarding/ageBand';
import { getOrCreateIdentity, type InstallIdentity } from '../services/identity';
import { saveAgeBand } from '../services/preferences';
import { useLanguage } from './LanguageProvider';

type SessionStatus = 'starting' | 'registering' | 'ready' | 'offline';

export interface SessionContextValue {
  status: SessionStatus;
  ownerKey: string | null;
  ageBand: AgeBand | null;
  setAgeBand: (ageBand: AgeBand) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 30_000, 60_000];

function currentPlatform(): 'ios' | 'android' | 'web' {
  return Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
}

interface SessionProviderProps {
  initialAgeBand: AgeBand | null;
  children: ReactNode;
}

/** Anonymous-first session (BUILD_GUIDE §4, §7.8). Must be rendered inside ConvexProvider. */
export function SessionProvider({ initialAgeBand, children }: SessionProviderProps) {
  const { language } = useLanguage();
  const register = useMutation(api.installs.register);
  const setAgeBandMutation = useMutation(api.installs.setAgeBand);
  const setLocaleMutation = useMutation(api.installs.setLocale);

  const [identity, setIdentity] = useState<InstallIdentity | null>(null);
  const [status, setStatus] = useState<SessionStatus>('starting');
  const [ageBand, setAgeBandState] = useState<AgeBand | null>(initialAgeBand);
  const [serverAgeBand, setServerAgeBand] = useState<AgeBand | null>(null);
  const [serverLocale, setServerLocale] = useState<string | null>(null);
  const languageRef = useRef(language);
  languageRef.current = language;

  // 1. Identity from SecureStore (created on first launch).
  useEffect(() => {
    let cancelled = false;
    getOrCreateIdentity().then((id) => {
      if (!cancelled) setIdentity(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Register with Convex, retrying with backoff while offline.
  useEffect(() => {
    if (!identity) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const attempt = async (n: number) => {
      setStatus(n === 0 ? 'registering' : 'offline');
      try {
        const result = await register({
          ownerKey: identity.ownerKey,
          installToken: identity.installToken,
          platform: currentPlatform(),
          appVersion,
          locale: languageRef.current,
        });
        if (cancelled) return;
        setServerAgeBand(result.ageBand);
        setServerLocale(languageRef.current);
        setStatus('ready');
      } catch {
        if (cancelled) return;
        setStatus('offline');
        const delay = RETRY_DELAYS_MS[Math.min(n, RETRY_DELAYS_MS.length - 1)];
        timer = setTimeout(() => void attempt(n + 1), delay);
      }
    };
    void attempt(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [identity, register]);

  // 3. Push a locally chosen age band once the server knows the install.
  useEffect(() => {
    if (status !== 'ready' || !identity || !ageBand || ageBand === serverAgeBand) return;
    setAgeBandMutation({ installToken: identity.installToken, ageBand })
      .then(() => setServerAgeBand(ageBand))
      .catch(() => {
        // Retried on the next launch (register → compare again).
      });
  }, [status, identity, ageBand, serverAgeBand, setAgeBandMutation]);

  // 4. Keep the install's locale in sync when the language changes without a restart.
  useEffect(() => {
    if (status !== 'ready' || !identity || serverLocale === null || language === serverLocale) return;
    setLocaleMutation({ installToken: identity.installToken, locale: language })
      .then(() => setServerLocale(language))
      .catch(() => {
        // register sends the locale again on the next launch
      });
  }, [status, identity, language, serverLocale, setLocaleMutation]);

  const setAgeBand = useCallback(async (next: AgeBand) => {
    await saveAgeBand(next);
    setAgeBandState(next);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ status, ownerKey: identity?.ownerKey ?? null, ageBand, setAgeBand }),
    [status, identity, ageBand, setAgeBand],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
