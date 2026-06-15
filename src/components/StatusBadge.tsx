'use client';

interface StatusBadgeProps {
  status: string;
}

const statusMap: Record<string, string> = {
  approved: 'badge-approved',
  active: 'badge-active',
  completed: 'badge-completed',
  paid: 'badge-paid',
  pending: 'badge-pending',
  submitted: 'badge-submitted',
  rejected: 'badge-rejected',
  cancelled: 'badge-cancelled',
  failed: 'badge-failed',
  confirmed: 'badge-confirmed',
  disputed: 'badge-disputed',
  delivered: 'badge-delivered',
  inactive: 'badge-rejected',
  'in-progress': 'badge-confirmed',
  resolved: 'badge-approved',
  open: 'badge-pending',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = (status || '').toLowerCase().trim();
  const className = statusMap[normalized] || 'badge-pending';

  return (
    <span className={`badge ${className}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
