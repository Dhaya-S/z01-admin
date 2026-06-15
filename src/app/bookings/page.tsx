'use client';

import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ImageViewer from '@/components/ImageViewer';
import { adminApi, getImageUrl } from '@/lib/api';
import { formatINR, formatDate, formatDateTime, formatPhone, formatDuration } from '@/lib/formatters';

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'delivered', 'disputed'];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    adminApi.getBookings({ status: statusFilter, from: fromDate, to: toDate, search, page, limit: 20 })
      .then(res => {
        setBookings(res.data.data);
        setTotal(res.data.total);
        setTotalRevenue(res.data.totalRevenue);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter, fromDate, toDate, search, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = [
    {
      key: 'id', header: 'Booking ID',
      render: (v: any) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>#{String(v).slice(0, 8)}</span>,
    },
    {
      key: 'user_name', header: 'Customer',
      render: (v: any, row: any) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{v || '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatPhone(row.user_phone)}</div>
        </div>
      ),
    },
    {
      key: 'vendor_name', header: 'Vendor',
      render: (v: any) => <span style={{ fontSize: 13 }}>{v || '—'}</span>,
    },
    {
      key: 'listing_title', header: 'Listing',
      render: (v: any, row: any) => (
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{v || '—'}</div>
          <span className="service-pill" style={{ fontSize: 10 }}>{row.category}</span>
        </div>
      ),
    },
    {
      key: 'start_date', header: 'Date',
      render: (v: any) => formatDate(v),
    },
    {
      key: 'total_amount', header: 'Amount',
      render: (v: any) => <span style={{ fontWeight: 600, color: 'var(--success)' }}>{formatINR(v)}</span>,
    },
    {
      key: 'status', header: 'Status',
      render: (v: any) => <StatusBadge status={v} />,
    },
  ];

  const deliveryImages: string[] = selected?.delivery_proof_urls || [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bookings <span className="count-badge">{total}</span></h1>
          <div className="page-subtitle">Total Revenue: <strong style={{ color: 'var(--success)' }}>{formatINR(totalRevenue)}</strong></div>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            className={`filter-pill ${statusFilter === s ? 'active' : ''}`}
            onClick={() => { setStatusFilter(s); setPage(1); }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Date range filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>From</label>
          <input type="date" className="input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>To</label>
          <input type="date" className="input" value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
        {(fromDate || toDate) && (
          <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-end' }} onClick={() => { setFromDate(''); setToDate(''); }}>
            Clear Dates
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        isLoading={loading}
        totalCount={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        searchPlaceholder="Search customer, vendor, listing..."
        onSearch={q => { setSearch(q); setPage(1); }}
        externalSearch
        onRowClick={setSelected}
        emptyMessage="No bookings found"
      />

      {/* Booking Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">Booking Details — #{String(selected.id).slice(0, 8)}</span>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Customer */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</div>
                  <div className="info-grid">
                    <div className="info-item"><div className="info-label">Name</div><div className="info-value">{selected.user_name || '—'}</div></div>
                    <div className="info-item"><div className="info-label">Phone</div><div className="info-value">{formatPhone(selected.user_phone)}</div></div>
                    <div className="info-item" style={{ gridColumn: 'span 2' }}><div className="info-label">Email</div><div className="info-value">{selected.user_email || '—'}</div></div>
                  </div>
                </div>

                {/* Vendor */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vendor</div>
                  <div className="info-grid">
                    <div className="info-item"><div className="info-label">Company</div><div className="info-value">{selected.vendor_name || '—'}</div></div>
                    <div className="info-item"><div className="info-label">Contact</div><div className="info-value">{selected.vendor_contact || '—'}</div></div>
                  </div>
                </div>
              </div>

              <hr className="divider" />

              {/* Booking Details */}
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Booking Info</div>
              <div className="info-grid">
                <div className="info-item"><div className="info-label">Listing</div><div className="info-value">{selected.listing_title}</div></div>
                <div className="info-item"><div className="info-label">Category</div><div className="info-value"><span className="service-pill">{selected.category}</span></div></div>
                <div className="info-item"><div className="info-label">Start Date</div><div className="info-value">{formatDateTime(selected.start_date)}</div></div>
                <div className="info-item"><div className="info-label">End Date</div><div className="info-value">{formatDateTime(selected.end_date)}</div></div>
                <div className="info-item"><div className="info-label">Duration</div><div className="info-value">{selected.start_date && selected.end_date ? formatDuration(selected.start_date, selected.end_date) : '—'}</div></div>
                <div className="info-item"><div className="info-label">Status</div><div className="info-value"><StatusBadge status={selected.status} /></div></div>
                <div className="info-item"><div className="info-label">Total Amount</div><div className="info-value" style={{ color: 'var(--success)', fontWeight: 700 }}>{formatINR(selected.total_amount)}</div></div>
                <div className="info-item"><div className="info-label">Deposit Paid</div><div className="info-value">{formatINR(selected.deposit_amount)}</div></div>
              </div>

              {selected.razorpay_order_id && (
                <div style={{ marginTop: 12 }}>
                  <div className="info-label">Razorpay Order ID</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{selected.razorpay_order_id}</div>
                </div>
              )}

              {/* Delivery Proofs */}
              {deliveryImages.length > 0 && (
                <>
                  <hr className="divider" />
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Delivery Proofs</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {deliveryImages.map((img, i) => (
                      <img
                        key={i}
                        src={getImageUrl(img)}
                        style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                        onClick={() => setLightbox({ images: deliveryImages, index: i })}
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
