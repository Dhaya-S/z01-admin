// ─── Currency ─────────────────────────────────
export const formatINR = (amount: number | string | null | undefined): string => {
  const num = parseFloat(String(amount || 0));
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

// ─── Date ─────────────────────────────────────
export const formatDate = (date: string | null | undefined): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ─── Phone ────────────────────────────────────
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '—';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

// ─── Stars ────────────────────────────────────
export const renderStars = (rating: number): string => {
  const filled = Math.round(rating);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
};

// ─── Truncate ─────────────────────────────────
export const truncate = (text: string | null | undefined, maxLen = 80): string => {
  if (!text) return '—';
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
};

// ─── Duration ─────────────────────────────────
export const formatDuration = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return '1 day';
  return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
};
