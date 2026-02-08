'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import Keycloak from 'keycloak-js';
import SignClient from '@walletconnect/sign-client';
import { SessionTypes } from '@walletconnect/types';
import { ethers } from 'ethers';

// ── Keycloak singleton ──────────────────────────────────────────────────────

const keycloak = typeof window !== 'undefined'
  ? new Keycloak({
      url: 'https://auth.solvewithvia.com/auth',
      realm: 'ztf_demo',
      clientId: 'localhost-app',
    })
  : (null as unknown as Keycloak);

// Guard against double init (React Strict Mode runs useEffect twice)
let keycloakInitPromise: Promise<boolean> | null = null;

// ── Types ───────────────────────────────────────────────────────────────────

interface ZTFState {
  isConnected: boolean;
  address: string | null;
  email: string | null;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string | null>;
}

// ── Context ─────────────────────────────────────────────────────────────────

const ZTFContext = createContext<ZTFState | null>(null);

// ── Custom WalletConnect Storage ────────────────────────────────────────────

class WalletConnectStorageService {
  keyPrefix = 'wc@2:';
  private restoredData: Record<string, string> = {};

  async getItem<T = unknown>(key: string): Promise<T | undefined> {
    if (this.restoredData[key] !== undefined) {
      return JSON.parse(this.restoredData[key]) as T;
    }
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  }

  async setItem<T = unknown>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
    delete this.restoredData[key];
  }

  async getKeys(): Promise<string[]> {
    const localKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith(this.keyPrefix),
    );
    const restoredKeys = Object.keys(this.restoredData).filter((k) =>
      k.startsWith(this.keyPrefix),
    );
    return [...new Set([...localKeys, ...restoredKeys])];
  }

  async getEntries<T = unknown>(): Promise<[string, T][]> {
    const keys = await this.getKeys();
    const entries: [string, T][] = [];
    for (const key of keys) {
      const value = await this.getItem<T>(key);
      if (value !== undefined) entries.push([key, value]);
    }
    return entries;
  }

  clearAll(): void {
    const keysToRemove = Object.keys(localStorage).filter(
      (k) => k.startsWith(this.keyPrefix) || k === 'wc@2:client:session',
    );
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    this.restoredData = {};
  }

  async storeWcInfo(sessionInfo: Record<string, unknown>): Promise<void> {
    const wcKeys = [
      'wc@2:client:0.3//session',
      'wc@2:core:0.3//subscription',
      'wc@2:core:0.3//messages',
      'wc@2:client:0.3//proposal',
      'wc@2:core:0.3//keychain',
      'wc@2:core:0.3//pairing',
      'wc@2:core:0.3//history',
      'wc@2:core:0.3//expirer',
    ];

    for (const key of wcKeys) {
      if (sessionInfo[key] !== undefined) {
        let value = sessionInfo[key];
        if (Array.isArray(value)) {
          value = value.map((item: unknown) => {
            if (item && typeof item === 'object') {
              const cleaned: Record<string, unknown> = {};
              for (const [k, v] of Object.entries(
                item as Record<string, unknown>,
              )) {
                cleaned[k] = v === null ? [] : v;
              }
              return cleaned;
            }
            return item;
          });
        }
        const jsonStr = JSON.stringify(value);
        this.restoredData[key] = jsonStr;
        localStorage.setItem(key, jsonStr);
      }
    }

    const sessionData = sessionInfo['wc@2:client:0.3//session'];
    if (sessionData) {
      const jsonStr = JSON.stringify(sessionData);
      this.restoredData['wc@2:client:session'] = jsonStr;
      localStorage.setItem('wc@2:client:session', jsonStr);
    }
  }
}

// ── Provider ────────────────────────────────────────────────────────────────

const TOKEN_MIN_VALIDITY_SECONDS = 350;
const TOKEN_REFRESH_INTERVAL_MS = 300000;

export function ZTFProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signClient, setSignClient] = useState<SignClient | null>(null);
  const [session, setSession] = useState<SessionTypes.Struct | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  const extractAddress = useCallback(
    (sess: SessionTypes.Struct): string | null => {
      const ns = sess.namespaces;
      const accounts =
        ns.viasecurechain?.accounts ||
        Object.values(ns).find((c) => c.accounts?.length)?.accounts;
      if (!accounts?.length) return null;
      return accounts[0].split(':')[2] || null;
    },
    [],
  );

  const initWalletConnect = useCallback(
    async (
      storageService?: WalletConnectStorageService,
    ): Promise<SignClient> => {
      const client = await SignClient.init({
        projectId: 'f54e2cf5d6e7a0f8ac954656ff5591b6',
        relayUrl: 'wss://relay.wallet.solvewithvia.com',
        storage: storageService as never,
        metadata: {
          name: 'World Cup Fan Passport',
          description: 'Pledge allegiance to your World Cup team',
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.ico`],
        },
      });

      client.on('session_update', (args) => {
        const updated = client.session.get(args.topic);
        setSession(updated);
        const addr = extractAddress(updated);
        if (addr) setAddress(addr);
      });

      client.on('session_delete', () => {
        setSession(null);
        setAddress(null);
        setIsConnected(false);
      });

      return client;
    },
    [extractAddress],
  );

  const restoreSession = useCallback(
    async (client: SignClient) => {
      const sessions = client.session.getAll();
      if (!sessions.length) return;

      const now = Date.now();
      const validSessions = sessions.filter(
        (s) => s.expiry * 1000 > now && s.acknowledged,
      );
      if (!validSessions.length) return;

      const activeSession = validSessions[0];
      try {
        await client.ping({ topic: activeSession.topic });
        setSession(activeSession);
        const addr = extractAddress(activeSession);
        if (addr) {
          setAddress(addr);
          setIsConnected(true);
        }
      } catch {
        // Session is stale
      }
    },
    [extractAddress],
  );

  useEffect(() => {
    if (!keycloak) return;
    let refreshInterval: ReturnType<typeof setInterval>;

    const init = async () => {
      setIsLoading(true);
      try {
        // Clear Keycloak error params from URL to prevent auth loops
        const url = new URL(window.location.href);
        if (url.searchParams.has('error')) {
          url.searchParams.delete('error');
          url.searchParams.delete('error_description');
          url.searchParams.delete('state');
          url.searchParams.delete('iss');
          window.history.replaceState({}, '', url.pathname);
        }

        // Prevent double init from React Strict Mode
        if (!keycloakInitPromise) {
          keycloakInitPromise = keycloak.init({
            onLoad: 'login-required',
            redirectUri: window.location.origin + '/',
            checkLoginIframe: false,
            responseMode: 'query',
            pkceMethod: 'S256',
            scope: 'openid profile email',
            checkLoginIframeInterval: 0,
            messageReceiveTimeout: 10000,
            flow: 'standard',
            useNonce: true,
          });
        }

        await keycloakInitPromise;

        if (!keycloak.authenticated) return;
        setAuthenticated(true);
        setEmail(keycloak.tokenParsed?.email ?? null);

        const refreshToken = () => {
          keycloak.updateToken(TOKEN_MIN_VALIDITY_SECONDS).catch((err) => {
            console.error('Token refresh failed:', err);
          });
        };
        refreshInterval = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL_MS);

        const userInfoUrl = `https://auth.solvewithvia.com/auth/realms/ztf_demo/protocol/openid-connect/userinfo`;
        const resp = await fetch(userInfoUrl, {
          headers: { Authorization: `Bearer ${keycloak.token}` },
        });
        const userInfo = await resp.json();

        let wcInfo: Record<string, unknown> | null = null;
        if (userInfo.walletConnectSessionInfo) {
          try {
            const decoded = atob(userInfo.walletConnectSessionInfo);
            wcInfo = JSON.parse(decoded);
          } catch {
            wcInfo =
              typeof userInfo.walletConnectSessionInfo === 'string'
                ? JSON.parse(userInfo.walletConnectSessionInfo)
                : userInfo.walletConnectSessionInfo;
          }
        }

        const storage = new WalletConnectStorageService();
        // Clear stale WC data from a previous user before restoring
        storage.clearAll();
        if (wcInfo) {
          await storage.storeWcInfo(wcInfo);
        }
        const client = await initWalletConnect(storage);
        setSignClient(client);
        await restoreSession(client);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = useCallback(async () => {
    if (!signClient) {
      setError('WalletConnect not initialized');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { uri, approval } = await signClient.connect({
        optionalNamespaces: {
          viasecurechain: {
            methods: ['personal_sign'],
            chains: ['viasecurechain:mainnet'],
            events: [],
          },
        },
      });

      if (uri) {
        console.log('WalletConnect URI:', uri);
      }

      const newSession = (await Promise.race([
        approval(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Connection timeout after 5 minutes')),
            300000,
          ),
        ),
      ])) as SessionTypes.Struct;

      setSession(newSession);
      const addr = extractAddress(newSession);
      if (addr) {
        setAddress(addr);
        setIsConnected(true);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Connection failed',
      );
    } finally {
      setIsLoading(false);
    }
  }, [signClient, extractAddress]);

  const disconnect = useCallback(() => {
    if (signClient && session) {
      signClient
        .disconnect({
          topic: session.topic,
          reason: { code: 6000, message: 'User disconnected' },
        })
        .catch(() => {});
    }
    setSession(null);
    setAddress(null);
    setIsConnected(false);
    if (keycloak) {
      keycloak.logout({ redirectUri: window.location.origin + '/' });
    }
  }, [signClient, session]);

  const signMessage = useCallback(
    async (message: string): Promise<string | null> => {
      if (!signClient || !session) return null;

      const ns = session.namespaces;
      const accounts =
        ns.viasecurechain?.accounts ||
        Object.values(ns).find((c) => c.accounts?.length)?.accounts;
      if (!accounts?.length) return null;

      const fullAccount = accounts[0];
      const fromAccount = fullAccount.split(':')[2];
      const chainId = fullAccount.split(':').slice(0, 2).join(':');

      const params = [
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message)),
        fromAccount,
      ];

      const signature = await signClient.request({
        topic: session.topic,
        chainId,
        request: {
          method: 'personal_sign',
          params,
        },
      });

      return signature as string;
    },
    [signClient, session],
  );

  return (
    <ZTFContext.Provider
      value={{
        isConnected,
        address,
        email,
        isLoading,
        error,
        connect,
        disconnect,
        signMessage,
      }}
    >
      {children}
    </ZTFContext.Provider>
  );
}

export function useZTF(): ZTFState {
  const ctx = useContext(ZTFContext);
  if (!ctx) throw new Error('useZTF must be used within ZTFProvider');
  return ctx;
}
