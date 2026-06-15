export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
};

export const setToken = (token: string, user: any): void => {
  localStorage.setItem('admin_token', token);
  localStorage.setItem('admin_user', JSON.stringify(user));
};

export const clearAuth = (): void => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
};

export const getAdminUser = (): any | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('admin_user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = getToken();
  if (!token) return false;
  try {
    // Decode JWT payload (no signature verification — that's the server's job)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      clearAuth();
      return false;
    }
    return payload.role === 'admin';
  } catch {
    return false;
  }
};
