'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import { adminApi, getImageUrl } from '@/lib/api';
import { formatDate, formatPhone } from '@/lib/formatters';

const STATUS_OPTIONS = ['all', 'pending', 'submitted', 'approved', 'rejected'];

export default function VendorsPage({ searchParams }: { searchParams?: any }) {
  const router = useRouter();
  const toast = useToast();

  const [vendors, setVendors] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const status = searchParams?.status;
    if (status && typeof status === 'string') {
      setStatusFilter(status);
    } else {
      setStatusFilter('all');
    }
  }, [searchParams]);

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: 'approve' | 'reject';
    vendorId: string;
    vendorName: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVendors = useCallback(() => {
    setLoading(true);
    adminApi
      .getVendors({ status: statusFilter, search, page, limit: 20 })
      .then(res => {
        setVendors(res.data.data);
        setTotal(res.data.total);
      })
      .catch(() => toast.error('Failed to load vendors'))
      .finally(() => setLoading(false));
  }, [statusFilter, search, page]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleApprove = async (vendorId: string, _reason?: string) => {
    setActionLoading(true);
    try {
      await adminApi.approveVendor(vendorId);
      toast.success('Vendor approved successfully!');
      fetchVendors();
    } catch {
      toast.error('Failed to approve vendor');
    } finally {
      setActionLoading(false);
      setConfirmModal(null);
    }
  };

  const handleReject = async (_vendorId: string, reason?: string) => {
    if (!confirmModal) return;
    setActionLoading(true);
    try {
      await adminApi.rejectVendor(confirmModal.vendorId, reason || '');
      toast.success('Vendor rejected');
      fetchVendors();
    } catch {
      toast.error('Failed to reject vendor');
    } finally {
      setActionLoading(false);
      setConfirmModal(null);
      setRejectReason('');
    }
  };

  const columns = [
    {
      key: 'row',
      header: '#',
      sortable: false,
      render: (_: any, __: any, idx: number) => (
        <span style={{ color: 'var(--text-muted)' }}>{(page - 1) * 20 + idx + 1}</span>
      ),
      width: '50px',
    },
    {
      key: 'company_name',
      header: 'Vendor',
      render: (_: any, row: any) => (
        <div className="vendor-cell">
          <div className="avatar">
            {row.profile_photo ? (
              <img src={getImageUrl(row.profile_photo)} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              (row.company_name?.[0] || 'V').toUpperCase()
            )}
          </div>
          <div className="vendor-cell-info">
            <span className="vendor-cell-name">{row.company_name}</span>
            <span className="vendor-cell-sub">{row.contact_person}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (v: any) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatPhone(v)}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (v: any) => <span style={{ fontSize: 12 }}>{v || '—'}</span>,
    },
    {
      key: 'service_types',
      header: 'Services',
      sortable: false,
      render: (v: any) => {
        const arr: string[] = Array.isArray(v) ? v : (v ? [v] : []);
        const shown = arr.slice(0, 2);
        const rest = arr.length - shown.length;
        return (
          <div className="service-pills">
            {shown.map((s: string, i: number) => (
              <span key={i} className="service-pill">{s}</span>
            ))}
            {rest > 0 && <span className="service-pill">+{rest}</span>}
          </div>
        );
      },
    },
    {
      key: 'onboarding_status',
      header: 'Status',
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      key: 'current_step',
      header: 'Step',
      render: (v: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {v ?? 0}/7
          </span>
          <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, minWidth: 50 }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, ((v ?? 0) / 7) * 100)}%`,
                background: 'var(--accent-gradient)',
                borderRadius: 2,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Joined',
      render: (v: any) => formatDate(v),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_: any, row: any) => (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/vendors/${row.id}`)}>
            View
          </button>
          {row.onboarding_status === 'submitted' && (
            <>
              <button
                className="btn btn-success btn-sm"
                title="Approve"
                onClick={e => {
                  e.stopPropagation();
                  setConfirmModal({ open: true, type: 'approve', vendorId: row.id, vendorName: row.company_name });
                }}
              >
                <CheckCircle size={13} />
              </button>
              <button
                className="btn btn-danger btn-sm"
                title="Reject"
                onClick={e => {
                  e.stopPropagation();
                  setRejectReason('');
                  setConfirmModal({ open: true, type: 'reject', vendorId: row.id, vendorName: row.company_name });
                }}
              >
                <XCircle size={13} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Vendors
            <span className="count-badge">{total}</span>
          </h1>
          <div className="page-subtitle">Manage vendor onboarding, approvals, and profiles</div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="filter-bar">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            className={`filter-pill ${statusFilter === s ? 'active' : ''}`}
            onClick={() => { setStatusFilter(s); setPage(1); }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={vendors}
        isLoading={loading}
        totalCount={total}
        page={page}
        limit={20}
        onPageChange={p => setPage(p)}
        searchPlaceholder="Search vendor name, email, phone..."
        onSearch={q => { setSearch(q); setPage(1); }}
        externalSearch
        emptyMessage="No vendors found"
      />

      {/* Approve Confirm */}
      {confirmModal?.type === 'approve' && (
        <ConfirmModal
          isOpen={confirmModal.open}
          title="Approve Vendor"
          message={`Are you sure you want to approve "${confirmModal.vendorName}"? They will be able to receive bookings.`}
          onConfirm={() => handleApprove(confirmModal.vendorId)}
          onCancel={() => setConfirmModal(null)}
          variant="success"
          confirmLabel="✅ Approve Vendor"
          isLoading={actionLoading}
        />
      )}

      {/* Reject Confirm */}
      {confirmModal?.type === 'reject' && (
        <ConfirmModal
          isOpen={confirmModal.open}
          title="Reject Vendor"
          message={`Reject "${confirmModal.vendorName}"? Please provide a reason so the vendor knows what to fix.`}
          onConfirm={(reason) => handleReject(confirmModal.vendorId, reason)}
          onCancel={() => { setConfirmModal(null); setRejectReason(''); }}
          variant="danger"
          confirmLabel="❌ Reject Vendor"
          withReason
          reasonPlaceholder="Explain why this vendor is being rejected..."
          isLoading={actionLoading}
          reason={rejectReason}
          onReasonChange={setRejectReason}
        />
      )}
    </>
  );
}
