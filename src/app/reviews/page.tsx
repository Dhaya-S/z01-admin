'use client';

import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import ImageViewer from '@/components/ImageViewer';
import { adminApi, getImageUrl } from '@/lib/api';
import { formatDate, renderStars } from '@/lib/formatters';

const RATING_OPTIONS = [0, 1, 2, 3, 4, 5];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [avgRating, setAvgRating] = useState('0');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    adminApi.getReviews({ rating: rating || undefined, page, limit: 20 })
      .then(res => {
        setReviews(res.data.data);
        setTotal(res.data.total);
        setAvgRating(res.data.avgRating);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [rating, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = [
    {
      key: 'rating', header: 'Rating',
      render: (v: any) => <span style={{ color: '#f59e0b', fontSize: 15 }}>{renderStars(v)}</span>,
      width: '120px',
    },
    {
      key: 'reviewer_name', header: 'Reviewer',
      render: (v: any) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v || '—'}</span>,
    },
    {
      key: 'comment', header: 'Comment',
      render: (v: any) => (
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {v ? (v.length > 70 ? v.slice(0, 70) + '…' : v) : '—'}
        </span>
      ),
    },
    {
      key: 'listing_title', header: 'Listing',
      render: (v: any) => <span style={{ fontSize: 12 }}>{v || '—'}</span>,
    },
    {
      key: 'vendor_name', header: 'Vendor',
      render: (v: any) => <span style={{ fontSize: 12 }}>{v || '—'}</span>,
    },
    {
      key: 'vendor_reply', header: 'Has Reply', sortable: false,
      render: (v: any) => v
        ? <span className="badge badge-approved">Yes</span>
        : <span className="badge badge-pending">No</span>,
    },
    { key: 'created_at', header: 'Date', render: (v: any) => formatDate(v) },
    {
      key: 'actions', header: '', sortable: false,
      render: (_: any, row: any) => (
        <button className="btn btn-secondary btn-sm" onClick={() => setSelected(row)}>View</button>
      ),
    },
  ];

  const reviewImages: string[] = selected?.images || [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reviews <span className="count-badge">{total}</span></h1>
          <div className="page-subtitle">
            Platform average: <span style={{ color: '#f59e0b', fontWeight: 600 }}>{renderStars(parseFloat(avgRating))} {avgRating}</span>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        {RATING_OPTIONS.map(r => (
          <button
            key={r}
            className={`filter-pill ${rating === r ? 'active' : ''}`}
            onClick={() => { setRating(r); setPage(1); }}
          >
            {r === 0 ? 'All' : '★'.repeat(r)}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={reviews}
        isLoading={loading}
        totalCount={total}
        page={page}
        limit={20}
        onPageChange={setPage}
        emptyMessage="No reviews found"
        onRowClick={setSelected}
      />

      {/* Review Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal modal-md">
            <div className="modal-header">
              <span className="modal-title">Review Detail</span>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ color: '#f59e0b', fontSize: 20 }}>{renderStars(selected.rating)}</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>{selected.reviewer_name || 'Customer'}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(selected.created_at)}</div>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                {selected.comment || '—'}
              </p>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                For listing: <strong style={{ color: 'var(--text-secondary)' }}>{selected.listing_title}</strong> by <strong style={{ color: 'var(--text-secondary)' }}>{selected.vendor_name}</strong>
              </div>
              {reviewImages.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {reviewImages.map((img: string, i: number) => (
                    <img
                      key={i}
                      src={getImageUrl(img)}
                      style={{ width: 70, height: 70, borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => setLightbox({ images: reviewImages, index: i })}
                    />
                  ))}
                </div>
              )}
              {selected.vendor_reply && (
                <div className="review-reply">
                  <strong>Vendor Reply:</strong> {selected.vendor_reply}
                </div>
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
