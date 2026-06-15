'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ImageViewer from '@/components/ImageViewer';
import { adminApi, getImageUrl } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/formatters';

const CATEGORIES = ['all', 'Studio', 'Equipment', 'Manpower'];

const renderTags = (val: any) => {
  if (!val) return <span style={{ color: 'var(--text-muted)' }}>None</span>;
  let arr: string[] = [];
  try {
    if (Array.isArray(val)) {
      arr = val;
    } else if (typeof val === 'string') {
      if (val.trim().startsWith('[') || val.trim().startsWith('{')) {
        arr = JSON.parse(val);
      } else {
        arr = val.split(/[,\s;]+/).filter(Boolean);
      }
    } else if (typeof val === 'object') {
      arr = Object.values(val);
    }
  } catch (e) {
    arr = [String(val)];
  }
  if (!Array.isArray(arr) || arr.length === 0) return <span style={{ color: 'var(--text-muted)' }}>None</span>;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
      {arr.map((item: any, idx: number) => (
        <span key={idx} className="service-pill" style={{ background: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', border: '1px solid rgba(79, 70, 229, 0.15)', fontSize: 11 }}>{String(item)}</span>
      ))}
    </div>
  );
};

export default function ListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    adminApi.getListings({ category, search, page, limit: 20 })
      .then(res => { setListings(res.data.data); setTotal(res.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, search, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = [
    {
      key: 'image_1', header: 'Image', sortable: false,
      render: (v: any) => v ? (
        <img src={getImageUrl(v)} className="listing-thumb" style={{ cursor: 'pointer' }} />
      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>,
    },
    {
      key: 'listing_title', header: 'Title',
      render: (v: any) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>,
    },
    {
      key: 'category', header: 'Category', sortable: false,
      render: (v: any) => <span className="service-pill">{v}</span>,
    },
    {
      key: 'vendor_name', header: 'Vendor',
      render: (v: any, row: any) => (
        <button
          style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer', fontSize: 13 }}
          onClick={e => { e.stopPropagation(); router.push(`/vendors/${row.vendor_id}`); }}
        >
          {v}
        </button>
      ),
    },
    {
      key: 'price', header: 'Price',
      render: (_: any, row: any) => {
        const rate = parseFloat(row.price_per_day) > 0 ? row.price_per_day : (row.price_per_hour || 0);
        const unit = parseFloat(row.price_per_day) > 0 ? '/day' : (parseFloat(row.price_per_hour) > 0 ? '/hour' : '');
        return <span style={{ fontWeight: 600 }}>{formatINR(rate)}{unit}</span>;
      },
    },
    {
      key: 'status', header: 'Status',
      render: (v: any) => <StatusBadge status={v || 'active'} />,
    },
    { key: 'created_at', header: 'Created', render: (v: any) => formatDate(v) },
    {
      key: 'actions', header: '', sortable: false,
      render: (_: any, row: any) => (
        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedListing(row)}>
          View
        </button>
      ),
    },
  ];

  const listingImages = selectedListing
    ? [selectedListing.image_1, selectedListing.image_2, selectedListing.image_3, selectedListing.image_4, selectedListing.image_5].filter(Boolean)
    : [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Listings <span className="count-badge">{total}</span></h1>
          <div className="page-subtitle">All vendor service listings across the platform</div>
        </div>
      </div>

      <div className="filter-bar">
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`filter-pill ${category === c ? 'active' : ''}`}
            onClick={() => { setCategory(c); setPage(1); }}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={listings}
        isLoading={loading}
        totalCount={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        searchPlaceholder="Search listing title..."
        onSearch={q => { setSearch(q); setPage(1); }}
        externalSearch
        onRowClick={setSelectedListing}
        emptyMessage="No listings found"
      />

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedListing(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">{selectedListing.listing_title}</span>
              <button className="modal-close" onClick={() => setSelectedListing(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {/* Images */}
              {listingImages.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
                  {listingImages.map((img: string, i: number) => (
                    <img
                      key={i}
                      src={getImageUrl(img)}
                      style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                      onClick={() => setLightbox({ images: listingImages, index: i })}
                    />
                  ))}
                </div>
              )}

              {/* General Metadata */}
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>General Info</div>
              <div className="info-grid">
                <div className="info-item"><div className="info-label">Category</div><div className="info-value"><span className="service-pill">{selectedListing.category}</span></div></div>
                {selectedListing.sub_category && <div className="info-item"><div className="info-label">Sub-Category</div><div className="info-value">{selectedListing.sub_category}</div></div>}
                <div className="info-item"><div className="info-label">Vendor</div><div className="info-value">{selectedListing.vendor_name}</div></div>
                <div className="info-item"><div className="info-label">Status</div><div className="info-value"><StatusBadge status={selectedListing.status || 'active'} /></div></div>
                <div className="info-item"><div className="info-label">Created</div><div className="info-value">{formatDate(selectedListing.created_at)}</div></div>
                {selectedListing.avg_rating && <div className="info-item"><div className="info-label">Avg Rating</div><div className="info-value" style={{ color: '#f59e0b', fontWeight: 600 }}>★ {selectedListing.avg_rating}</div></div>}
              </div>

              {/* Pricing & Booking details */}
              <hr className="divider" />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pricing & Policies</div>
              <div className="info-grid">
                <div className="info-item"><div className="info-label">Price per Hour</div><div className="info-value">{selectedListing.price_per_hour ? formatINR(selectedListing.price_per_hour) : '—'}</div></div>
                <div className="info-item"><div className="info-label">Price per Day</div><div className="info-value">{selectedListing.price_per_day ? formatINR(selectedListing.price_per_day) : '—'}</div></div>
                <div className="info-item"><div className="info-label">Security Deposit</div><div className="info-value">{selectedListing.deposit_percentage ? `${selectedListing.deposit_percentage}%` : (selectedListing.deposit_amount ? formatINR(selectedListing.deposit_amount) : '—')}</div></div>
                <div className="info-item"><div className="info-label">Min Booking</div><div className="info-value">{selectedListing.minimum_booking_hours ? `${selectedListing.minimum_booking_hours} hours` : '—'}</div></div>
                <div className="info-item"><div className="info-label">ID Verification</div><div className="info-value">{selectedListing.id_verification_required ? '✅ Required' : '❌ Not Required'}</div></div>
                <div className="info-item"><div className="info-label">Insurance</div><div className="info-value">{selectedListing.insurance_required ? '✅ Required' : '❌ Not Required'}</div></div>
                <div className="info-item"><div className="info-label">Min Age Limit</div><div className="info-value">{selectedListing.min_age ? `${selectedListing.min_age}+ years` : '—'}</div></div>
                <div className="info-item"><div className="info-label">Cancellation</div><div className="info-value" style={{ textTransform: 'capitalize' }}>{selectedListing.cancellation_policy || '—'}</div></div>
              </div>

              {/* Category-Specific details */}
              {selectedListing.category === 'Studio' && (
                <>
                  <hr className="divider" />
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Studio Specifications</div>
                  <div className="info-grid">
                    {selectedListing.area_sqft > 0 && <div className="info-item"><div className="info-label">Area (sqft)</div><div className="info-value">{selectedListing.area_sqft} sq. ft.</div></div>}
                    {selectedListing.capacity > 0 && <div className="info-item"><div className="info-label">Capacity</div><div className="info-value">{selectedListing.capacity} people</div></div>}
                    {selectedListing.opening_time && <div className="info-item"><div className="info-label">Opening Time</div><div className="info-value">{selectedListing.opening_time}</div></div>}
                    {selectedListing.closing_time && <div className="info-item"><div className="info-label">Closing Time</div><div className="info-value">{selectedListing.closing_time}</div></div>}
                  </div>
                  {selectedListing.amenities && (
                    <div style={{ marginTop: 12 }}>
                      <div className="info-label" style={{ marginBottom: 4 }}>Amenities</div>
                      {renderTags(selectedListing.amenities)}
                    </div>
                  )}
                  {selectedListing.equipments && (
                    <div style={{ marginTop: 12 }}>
                      <div className="info-label" style={{ marginBottom: 4 }}>Equipments Available</div>
                      {renderTags(selectedListing.equipments)}
                    </div>
                  )}
                  {selectedListing.manpower && (
                    <div style={{ marginTop: 12 }}>
                      <div className="info-label" style={{ marginBottom: 4 }}>Manpower Available</div>
                      {renderTags(selectedListing.manpower)}
                    </div>
                  )}
                </>
              )}

              {selectedListing.category === 'Equipment' && (
                <>
                  <hr className="divider" />
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Equipment Details</div>
                  <div className="info-grid">
                    {selectedListing.brand && <div className="info-item"><div className="info-label">Brand</div><div className="info-value">{selectedListing.brand}</div></div>}
                    {selectedListing.model && <div className="info-item"><div className="info-label">Model</div><div className="info-value">{selectedListing.model}</div></div>}
                    {selectedListing.quantity > 0 && <div className="info-item"><div className="info-label">Quantity Available</div><div className="info-value">{selectedListing.quantity} units</div></div>}
                    <div className="info-item"><div className="info-label">Delivery Available</div><div className="info-value">{selectedListing.delivery_available ? '✅ Yes' : '❌ No'}</div></div>
                  </div>
                  {selectedListing.specifications && (
                    <div style={{ marginTop: 12 }}>
                      <div className="info-label">Specifications</div>
                      <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4, whiteSpace: 'pre-line' }}>{selectedListing.specifications}</p>
                    </div>
                  )}
                </>
              )}

              {selectedListing.category === 'Manpower' && (
                <>
                  <hr className="divider" />
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manpower Specifications</div>
                  <div className="info-grid">
                    {selectedListing.experience_years > 0 && <div className="info-item"><div className="info-label">Experience</div><div className="info-value">{selectedListing.experience_years} years</div></div>}
                    <div className="info-item"><div className="info-label">Travel Available</div><div className="info-value">{selectedListing.travel_available ? '✅ Yes' : '❌ No'}</div></div>
                  </div>
                  {selectedListing.skills && (
                    <div style={{ marginTop: 12 }}>
                      <div className="info-label" style={{ marginBottom: 4 }}>Skills & Expertise</div>
                      {renderTags(selectedListing.skills)}
                    </div>
                  )}
                  {selectedListing.specifications && (
                    <div style={{ marginTop: 12 }}>
                      <div className="info-label">Specifications</div>
                      <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4, whiteSpace: 'pre-line' }}>{selectedListing.specifications}</p>
                    </div>
                  )}
                </>
              )}

              {/* Description & Rules */}
              <hr className="divider" />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description & Location</div>
              <div className="info-grid" style={{ gridTemplateColumns: '1fr' }}>
                {selectedListing.description && (
                  <div className="info-item">
                    <div className="info-label">Description</div>
                    <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 4 }}>
                      {selectedListing.description}
                    </p>
                  </div>
                )}
                {selectedListing.location_address && (
                  <div className="info-item" style={{ marginTop: 8 }}>
                    <div className="info-label">Address</div>
                    <div className="info-value" style={{ fontSize: 13.5, marginTop: 4 }}>{selectedListing.location_address}</div>
                  </div>
                )}
                {selectedListing.rules && (
                  <div className="info-item" style={{ marginTop: 8 }}>
                    <div className="info-label">Rules & Guidelines</div>
                    <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line', marginTop: 4 }}>
                      {selectedListing.rules}
                    </p>
                  </div>
                )}
              </div>
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
