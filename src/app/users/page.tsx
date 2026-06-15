'use client';

import { useEffect, useState, useCallback } from 'react';
import DataTable from '@/components/DataTable';
import { adminApi } from '@/lib/api';
import { formatDate, formatPhone } from '@/lib/formatters';
import { CheckCircle, XCircle } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetch = useCallback(() => {
    setLoading(true);
    adminApi.getUsers({ search, page, limit: 20 })
      .then(res => { setUsers(res.data.data); setTotal(res.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = [
    {
      key: 'row', header: '#', sortable: false,
      render: (_: any, __: any, idx: number) => (
        <span style={{ color: 'var(--text-muted)' }}>{(page - 1) * 20 + idx + 1}</span>
      ),
      width: '50px',
    },
    {
      key: 'name', header: 'Name',
      render: (v: any, row: any) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v || '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      ),
    },
    {
      key: 'phone', header: 'Phone',
      render: (v: any) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatPhone(v)}</span>,
    },
    {
      key: 'is_phone_verified', header: 'Verified',
      render: (v: any) => v
        ? <CheckCircle size={16} color="var(--success)" />
        : <XCircle size={16} color="var(--danger)" />,
    },
    {
      key: 'total_bookings', header: 'Bookings',
      render: (v: any) => (
        <span style={{ fontWeight: 600, color: v > 0 ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
          {v ?? 0}
        </span>
      ),
    },
    { key: 'created_at', header: 'Joined', render: (v: any) => formatDate(v) },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users <span className="count-badge">{total}</span></h1>
          <div className="page-subtitle">All registered users on the Z01 platform</div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={loading}
        totalCount={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        searchPlaceholder="Search name, email, phone..."
        onSearch={q => { setSearch(q); setPage(1); }}
        externalSearch
        emptyMessage="No users found"
      />
    </>
  );
}
