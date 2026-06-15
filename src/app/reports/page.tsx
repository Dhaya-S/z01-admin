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
  const [activeTab, setActiveTab] = useState<'bookings' | 'listings'>('bookings');

  // Booking issues state
  const [issues, setIssues] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');

  // Listing reports state
  const [listingReports, setListingReports] = useState<any[]>([]);
  const [listingTotal, setListingTotal] = useState(0);
  const [listingPage, setListingPage] = useState(1);
  const [listingLoading, setListingLoading] = useState(true);

  const [selected, setSelected] = useState<any>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const fetchBookings = useCallback(() => {
    setLoading(true);
    adminApi.getIssues({ status, page, limit: 20 })
      .then(res => {
        setIssues(res.data.data);
        setTotal(res.data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status, page]);

  const fetchListings = useCallback(() => {
    setListingLoading(true);
    adminApi.getListingReports({ page: listingPage, limit: 20 })
      .then(res => {
        setListingReports(res.data.data);
        setListingTotal(res.data.total);
      })
      .catch(console.error)
      .finally(() => setListingLoading(false));
  }, [listingPage]);

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    } else {
      fetchListings();
    }
  }, [activeTab, fetchBookings, fetchListings]);

  // Columns for Booking Issues
  const bookingColumns = [
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

  // Columns for Listing Reports
  const listingColumns = [
    {
      key: 'id', header: 'Report ID',
      render: (v: any) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>#R{v}</span>,
      width: '100px',
    },
    {
      key: 'listing_title', header: 'Listing',
      render: (v: any, row: any) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v || `Deleted Listing (ID: ${row.listing_id})`}</span>,
    },
    {
      key: 'vendor_name', header: 'Vendor',
      render: (v: any) => <span style={{ color: 'var(--text-secondary)' }}>{v || '—'}</span>,
    },
    {
      key: 'reason', header: 'Reason',
      render: (v: any) => <span style={{ color: 'var(--danger)', fontWeight: 500 }}>{v || '—'}</span>,
    },
    {
      key: 'description', header: 'Details',
      render: (v: any) => (
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {v ? (v.length > 80 ? v.slice(0, 80) + '…' : v) : '—'}
        </span>
      ),
    },
    {
      key: 'user_id', header: 'Reported By',
      render: (v: any) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{v ? `${v.slice(0, 8)}...` : 'anonymous'}</span>,
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
          <h1 className="page-title">Reports & Issues</h1>
          <div className="page-subtitle">Booking disputes and listing complaints reported by vendors or customers</div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => { setActiveTab('bookings'); setSelected(null); }}
        >
          Booking Issues <span className="count-badge" style={{ marginLeft: 6 }}>{total}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => { setActiveTab('listings'); setSelected(null); }}
        >
          Listing Reports <span className="count-badge" style={{ marginLeft: 6 }}>{listingTotal}</span>
        </button>
      </div>

      {activeTab === 'bookings' ? (
        <>
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
            columns={bookingColumns}
            data={issues}
            isLoading={loading}
            totalCount={total}
            page={page}
            limit={20}
            onPageChange={setPage}
            onRowClick={setSelected}
            emptyMessage="No booking issues reported"
          />
        </>
      ) : (
        <DataTable
          columns={listingColumns}
          data={listingReports}
          isLoading={listingLoading}
          totalCount={listingTotal}
          page={listingPage}
          limit={20}
          onPageChange={setListingPage}
          onRowClick={setSelected}
          emptyMessage="No listing reports in database"
        />
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal modal-md">
            {activeTab === 'bookings' ? (
              <>
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
              </>
            ) : (
              <>
                <div className="modal-header">
                  <span className="modal-title">Listing Report #R{selected.id}</span>
                  <button className="modal-close" onClick={() => setSelected(null)}><X size={18} /></button>
                </div>
                <div className="modal-body">
                  <div className="info-grid">
                    <div className="info-item"><div className="info-label">Listing Title</div><div className="info-value">{selected.listing_title || `Deleted Listing (ID: ${selected.listing_id})`}</div></div>
                    <div className="info-item"><div className="info-label">Vendor</div><div className="info-value">{selected.vendor_name || '—'}</div></div>
                    <div className="info-item"><div className="info-label">Reason</div><div className="info-value"><span style={{ fontWeight: 600, color: 'var(--danger)' }}>{selected.reason || '—'}</span></div></div>
                    <div className="info-item"><div className="info-label">Reported By</div><div className="info-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>{selected.user_id || 'anonymous'}</div></div>
                    <div className="info-item"><div className="info-label">Reported</div><div className="info-value">{formatDate(selected.created_at)}</div></div>
                  </div>
                  <hr className="divider" />
                  <div className="info-label" style={{ marginBottom: 8 }}>Description / Details</div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {selected.description || 'No additional details provided.'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {lightbox && (
        <ImageViewer images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </>
  );
}
