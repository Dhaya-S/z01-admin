import axios from 'axios';

const VENDOR_API_URL =
  process.env.NEXT_PUBLIC_VENDOR_API_URL || 'https://z01-backend-1.onrender.com';

const USER_API_URL =
  process.env.NEXT_PUBLIC_USER_API_URL || 'https://z01-user-backend.onrender.com';

const R2_PUBLIC_URL =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  'https://pub-2531ac33275d4afd8443b02c46c96ea3.r2.dev';

// ─── Helper ────────────────────────────────────
export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;
  return `${R2_PUBLIC_URL}/${path}`;
};

// ─── Token helpers ──────────────────────────────
const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
};

const onUnauthorized = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/login';
  }
};

// ─── Vendor API (Vendor Backend) ──────────────
export const vendorApi = axios.create({
  baseURL: VENDOR_API_URL,
  timeout: 30000,
});

vendorApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

vendorApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

// ─── User API (User Backend) ──────────────────
export const userApi = axios.create({
  baseURL: USER_API_URL,
  timeout: 30000,
});

userApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

userApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

// ─── Admin API calls ──────────────────────────
export const adminApi = {
  login: (email: string, password: string) =>
    vendorApi.post('/admin/login', { email, password }),

  getStats: () => vendorApi.get('/admin/stats'),

  getVendors: (params?: Record<string, any>) =>
    vendorApi.get('/admin/vendors', { params }),

  getVendor: (id: string) => vendorApi.get(`/admin/vendors/${id}`),

  approveVendor: (id: string) =>
    vendorApi.put(`/admin/vendors/${id}/approve`),

  rejectVendor: (id: string, reason: string) =>
    vendorApi.put(`/admin/vendors/${id}/reject`, { reason }),

  getListings: (params?: Record<string, any>) =>
    vendorApi.get('/admin/listings', { params }),

  getBookings: (params?: Record<string, any>) =>
    vendorApi.get('/admin/bookings', { params }),

  getUsers: (params?: Record<string, any>) =>
    vendorApi.get('/admin/users', { params }),

  getReviews: (params?: Record<string, any>) =>
    vendorApi.get('/admin/reviews', { params }),

  getIssues: (params?: Record<string, any>) =>
    vendorApi.get('/admin/issues', { params }),

  getListingReports: (params?: Record<string, any>) =>
    vendorApi.get('/admin/listing-reports', { params }),

  getRevenueAnalytics: () => vendorApi.get('/admin/analytics/revenue'),
  getBookingAnalytics: () => vendorApi.get('/admin/analytics/bookings'),
  getTopVendors: () => vendorApi.get('/admin/analytics/top-vendors'),
  getGrowthAnalytics: () => vendorApi.get('/admin/analytics/growth'),

  // Get a signed (temporary) URL for a private document stored in R2
  getDocUrl: (key: string) => vendorApi.get('/admin/doc-url', { params: { key } }),
};
