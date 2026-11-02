const ACCESS_TOKEN_KEY = 'dropshipper_access_token';
const REFRESH_TOKEN_KEY = 'dropshipper_refresh_token';
const USER_KEY = 'dropshipper_user';

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = String(token || '').replace(/^Bearer\s+/i, '').trim().split('.');
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function isDropshipperPortalAccessToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  // Ensure token belongs to dropshipper portal (reject admin/staff tokens)
  if (String(payload.portal || '') !== 'dropshipper') return false;
  if (String(payload.type || '') !== 'access') return false;
  if (!payload.id && !payload.sub && !payload.userId) return false;
  const exp = Number(payload.exp);
  if (Number.isFinite(exp) && exp * 1000 <= Date.now()) return false;
  return true;
}

export const isAuthBypassed = (): boolean => {
  return String(import.meta.env.VITE_DROPSHIPPER_AUTH_BYPASS || '').toLowerCase() === 'true';
};

export const getAuthToken = (): string => {
  if (typeof window === 'undefined') return '';
  const token = localStorage.getItem(ACCESS_TOKEN_KEY) || '';
  if (isDropshipperPortalAccessToken(token)) return token;
  if (isAuthBypassed()) {
    return localStorage.getItem('dropshipper_staff_token') || (import.meta.env.VITE_DROPSHIPPER_STAFF_TOKEN as string) || 'mock_bypass_token';
  }
  return '';
};

export const hasDropshipperPanelSession = (): boolean => {
  if (isAuthBypassed()) return true;
  return isDropshipperPortalAccessToken(getAuthToken());
};

export const setDropshipperSession = (payload: { accessToken?: string; refreshToken?: string; dropshipper?: unknown; user?: unknown }): void => {
  if (payload.accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken.replace(/^Bearer\s+/i, '').trim());
  }
  if (payload.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  }
  const userData = payload.dropshipper || payload.user;
  if (userData) {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  }
};

export const clearDropshipperSession = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getDropshipperUser = (): Record<string, any> | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Automatic 401 Silent Token Refresh Interceptor
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', token.startsWith('Bearer ') ? token : `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err) {
    // Re-throw or handle network drop
    throw err;
  }

  if (res.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        const refreshRes = await fetch('/api/dropshipper/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (data?.accessToken && isDropshipperPortalAccessToken(data.accessToken)) {
            setDropshipperSession({ accessToken: data.accessToken });
            headers.set('Authorization', `Bearer ${data.accessToken}`);
            res = await fetch(url, { ...options, headers });
          } else {
            clearDropshipperSession();
          }
        } else {
          clearDropshipperSession();
        }
      } catch {
        clearDropshipperSession();
      }
    }
  }

  return res;
}

