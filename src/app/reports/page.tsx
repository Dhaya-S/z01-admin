'use client';

import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ImageViewer from '@/components/ImageViewer';
import { adminApi, getImageUrl } from '@/lib/api';
import { formatDate } from '@/lib/formatters';

const STATUS_OPTIONS = ['all', 'open', 'in-progress', 'resolved'];

export default function ReportsPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<any>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    adminApi.getIssues({ status, page, limit: 20 })
      .then(res => { setIssues(res.data.data); setTotal(res.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = [
    {
      key: 'id', header: 'Issue ID',
      render: (v: any) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>#{String(v).slice(0, 8)}</span>,
      width: '100px',
    },
    {
      key: 'booking_ref', header: 'Booking ID',
      render: (v: any) => v ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>#{String(v).slice(0, 8)}</span> : '—',
    },
    {
      key: 'vendor_name', header: 'Vendor',
      render: (v: any) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v || '—'}</span>,
    },
    {
      key: 'description', header: 'Description',
      render: (v: any) => (
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {v ? (v.length > 80 ? v.slice(0, 80) + '…' : v) : '—'}
        </span>
      ),
    },
    {
      key: 'urls', header: 'Images', sortable: false,
      render: (v: any) => {
        const count = Array.isArray(v) ? v.length : 0;
        return count > 0 ? <span style={{ color: 'var(--info)', fontSize: 12 }}>{count} image{count > 1 ? 's' : ''}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>;
      },
    },
    {
      key: 'status', header: 'Status',
      render: (v: any) => <StatusBadge status={v || 'open'} />,
    },
    { key: 'created_at', header: 'Reported', render: (v: any) => formatDate(v) },
    {
      key: 'actions', header: '', sortable: false,
      render: (_: any, row: any) => (
        <button className="btn btn-secondary btn-sm" onClick={() => setSelected(row)}>View</button>
      ),
    },
  ];

  const issueImages: string[] = selected?.urls || [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Issues <span className="count-badge">{total}</span></h1>
          <div className="page-subtitle">Booking disputes and issues reported by vendors or customers</div>
        </div>
      </div>

      <div className="filter-bar">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            className={`filter-pill ${status === s ? 'active' : ''}`}
            onClick={() => { setStatus(s); setPage(1); }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={issues}
        isLoading={loading}
        totalCount={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        onRowClick={setSelected}
        emptyMessage="No issues reported"
      />

      {/* Issue Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal modal-md">
            <div className="modal-header">
              <span className="modal-title">Issue #{String(selected.id).slice(0, 8)}</span>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="info-grid">
                <div className="info-item"><div className="info-label">Vendor</div><div className="info-value">{selected.vendor_name || '—'}</div></div>
                <div className="info-item"><div className="info-label">Booking ID</div><div className="info-value" style={{ fontFamily: 'monospace' }}>#{String(selected.booking_ref || '').slice(0, 8) || '—'}</div></div>
                <div className="info-item"><div className="info-label">Status</div><div className="info-value"><StatusBadge status={selected.status || 'open'} /></div></div>
                <div className="info-item"><div className="info-label">Reported</div><div className="info-value">{formatDate(selected.created_at)}</div></div>
              </div>
              <hr className="divider" />
              <div className="info-label" style={{ marginBottom: 8 }}>Description</div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {selected.description || '—'}
              </p>
              {issueImages.length > 0 && (
                <>
                  <hr className="divider" />
                  <div className="info-label" style={{ marginBottom: 12 }}>Evidence Images ({issueImages.length})</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {issueImages.map((img: string, i: number) => (
                      <img
                        key={i}
                        src={getImageUrl(img)}
                        style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                        onClick={() => setLightbox({ images: issueImages, index: i })}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <ImageViewer images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </>
  );
}
