const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
let refreshInFlight: Promise<boolean> | null = null;
async function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(response => response.ok).catch(() => false).finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const options: RequestInit = { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } };
  let response = await fetch(`${API_URL}${path}`, options);
  if (response.status === 401 && !['/auth/login', '/auth/register', '/auth/refresh'].includes(path) && await refreshSession()) {
    response = await fetch(`${API_URL}${path}`, options);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message ?? 'Une erreur est survenue');
  }
  return response.json();
}
export type CurrentUser = { id: string; firstName: string; lastName: string; email: string; role: string; mustChangePassword: boolean; pharmacy: { id: string; name: string; city: string | null; country: string | null } | null };
export const authApi = { login: (data: { email: string; password: string }) => api('/auth/login', { method: 'POST', body: JSON.stringify(data) }), register: (data: Record<string, string>) => api('/auth/register', { method: 'POST', body: JSON.stringify(data) }), changePassword: (data: { currentPassword: string; newPassword: string }) => api('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }), me: () => api<CurrentUser>('/auth/me'), logout: () => api('/auth/logout', { method: 'POST' }) };
