'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, Phone, Mail, Building2,
  FileText, CreditCard, List, CalendarCheck, Star, IndianRupee,
  ExternalLink,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import ImageViewer from '@/components/ImageViewer';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import { adminApi, getImageUrl } from '@/lib/api';
import { formatINR, formatDate, formatPhone, renderStars, truncate } from '@/lib/formatters';

const TABS = [
  { id: 'documents', label: '📄 Documents', icon: FileText },
  { id: 'bank', label: '🏦 Bank Details', icon: CreditCard },
  { id: 'listings', label: '📋 Listings', icon: List },
  { id: 'bookings', label: '📅 Bookings', icon: CalendarCheck },
  { id: 'reviews', label: '⭐ Reviews', icon: Star },
  { id: 'earnings', label: '💰 Earnings', icon: IndianRupee },
];

const DOC_LABELS: Record<string, string> = {
  company_registration: 'Company Registration',
  pan_card: 'PAN Card',
  gst_certificate: 'GST Certificate',
  owner_id: 'Owner ID',
  address_proof: 'Address Proof',
  government_id: 'Government ID',
  selfie: 'Selfie / Photo',
  business_registration: 'Business Registration',
};

const isPdf = (url: string) => {
  if (!url) return false;
  return url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('/pdf');
};

const openFile = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};


export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');

  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ type: 'approve' | 'reject'; open: boolean } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    adminApi.getVendor(id)
      .then(res => setVendor(res.data))
      .catch(() => toast.error('Failed to load vendor'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await adminApi.approveVendor(id);
      toast.success('Vendor approved!');
      setVendor((prev: any) => ({ ...prev, onboarding_status: 'approved' }));
    } catch {
      toast.error('Failed to approve vendor');
    } finally {
      setActionLoading(false);
      setConfirmModal(null);
    }
  };

  const handleReject = async (_id: string, reason?: string) => {
    setActionLoading(true);
    try {
      await adminApi.rejectVendor(id, reason || '');
      toast.success('Vendor rejected');
      setVendor((prev: any) => ({
        ...prev,
        onboarding_status: 'rejected',
        rejection_reason: reason,
      }));
    } catch {
      toast.error('Failed to reject vendor');
    } finally {
      setActionLoading(false);
      setConfirmModal(null);
      setRejectReason('');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading vendor...</div>
      </div>
    );
  }

  if (!vendor) {
    return <div style={{ color: 'var(--danger)' }}>Vendor not found.</div>;
  }

  const location = vendor.location
    ? typeof vendor.location === 'string'
      ? JSON.parse(vendor.location)
      : vendor.location
    : null;

  const docs = vendor.documents || {};
  const bank = vendor.bankDetails || {};

  return (
    <>
      {/* Back button */}
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={() => router.back()}>
        <ArrowLeft size={14} /> Back to Vendors
      </button>

      {/* Approval Banner */}
      {vendor.onboarding_status === 'submitted' && (
        <div className="approval-banner">
          <div className="approval-banner-text">
            ⚠️ This vendor has submitted their onboarding. Please review all documents below before approving.
          </div>
          <div className="approval-banner-actions">
            <button
              className="btn btn-success"
              onClick={() => setConfirmModal({ type: 'approve', open: true })}
            >
              ✅ Approve Vendor
            </button>
            <button
              className="btn btn-danger"
              onClick={() => { setRejectReason(''); setConfirmModal({ type: 'reject', open: true }); }}
            >
              ❌ Reject with Reason
            </button>
          </div>
        </div>
      )}

      {/* Cover & Profile */}
      <div style={{ marginBottom: 24 }}>
        {vendor.cover_photo ? (
          <img src={getImageUrl(vendor.cover_photo)} alt="Cover" className="profile-banner" />
        ) : (
          <div
            className="profile-banner"
            style={{ background: 'linear-gradient(135deg, #1a0a3e 0%, #0a0a1e 50%, #0f0f2e 100%)' }}
          />
        )}
        <div className="profile-section">
          <div className="profile-avatar" style={{ position: 'absolute', top: -40, left: 24 }}>
            {vendor.profile_photo ? (
              <img
                src={getImageUrl(vendor.profile_photo)}
                alt="Profile"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <span>{(vendor.company_name?.[0] || 'V').toUpperCase()}</span>
            )}
          </div>
          <div className="profile-info">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div className="profile-name">{vendor.company_name}</div>
                <div className="profile-meta">
                  <span className="profile-meta-item"><Phone size={13} />{formatPhone(vendor.phone)}</span>
                  {vendor.email && <span className="profile-meta-item"><Mail size={13} />{vendor.email}</span>}
                  {location?.city && (
                    <span className="profile-meta-item"><MapPin size={13} />{location.city}</span>
                  )}
                  {vendor.business_type && (
                    <span className="profile-meta-item"><Building2 size={13} />{vendor.business_type}</span>
                  )}
                </div>
                <div className="service-pills">
                  {(Array.isArray(vendor.service_types) ? vendor.service_types : []).map((s: string, i: number) => (
                    <span key={i} className="service-pill">{s}</span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <StatusBadge status={vendor.onboarding_status} />
                {vendor.gst_number && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    GST: {vendor.gst_number}
                  </div>
                )}
              </div>
            </div>
            {vendor.bio && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.7 }}>
                {vendor.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Listings', value: vendor.stats?.totalListings ?? 0, color: '#7c3aed' },
          { label: 'Total Bookings', value: vendor.stats?.totalBookings ?? 0, color: '#6366f1' },
          { label: 'Revenue', value: formatINR(vendor.stats?.totalRevenue), color: '#10b981' },
          { label: 'Avg Rating', value: `${vendor.stats?.avgRating ?? '—'} ${renderStars(vendor.stats?.avgRating ?? 0)}`, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1 — Documents */}
      {activeTab === 'documents' && (
        <div className="docs-grid">
          {Object.entries(DOC_LABELS).map(([key, label]) => {
            const val = docs[key];
            const fileUrl = val ? getImageUrl(val) : null;
            const pdf = fileUrl ? isPdf(fileUrl) : false;
            return (
              <div key={key} className="doc-card">
                {fileUrl ? (
                  <>
                    {pdf ? (
                      /* PDF thumbnail */
                      <div
                        className="doc-thumb"
                        onClick={() => openFile(fileUrl)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          background: 'rgba(239,68,68,0.06)',
                          border: '1px solid rgba(239,68,68,0.2)',
                        }}
                      >
                        <span style={{ fontSize: 36 }}>📄</span>
                        <span style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>PDF Document</span>
                      </div>
                    ) : (
                      /* Image thumbnail */
                      <img
                        src={fileUrl}
                        alt={label}
                        className="doc-thumb"
                        onClick={() => setLightbox({ images: [val], index: 0 })}
                        onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const div = document.createElement('div');
                            div.className = 'doc-empty';
                            div.style.cssText = 'height:130px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer;background:rgba(239,68,68,0.06)';
                            div.innerHTML = `<span style="font-size:32px">📄</span><span style="font-size:11px;color:#ef4444;font-weight:600">Click to view</span>`;
                            div.onclick = () => openFile(fileUrl);
                            parent.insertBefore(div, target.nextSibling);
                          }
                        }}
                      />
                    )}
                    <div className="doc-footer">
                      <span className="doc-label">{label}</span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => pdf ? openFile(fileUrl) : setLightbox({ images: [val], index: 0 })}
                      >
                        <ExternalLink size={12} /> {pdf ? 'Open PDF' : 'View'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="doc-empty">
                      <span style={{ fontSize: 28 }}>📂</span>
                      <span>Not Uploaded</span>
                    </div>
                    <div className="doc-footer">
                      <span className="doc-label">{label}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}


      {/* TAB 2 — Bank Details */}
      {activeTab === 'bank' && (
        <div className="card">
          {!bank.id ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏦</div>
              <div className="empty-state-text">No bank details submitted yet</div>
            </div>
          ) : (
            <>
              <div className="info-grid">
                {[
                  { label: 'Account Holder', value: bank.account_holder_name },
                  { label: 'Bank Name', value: bank.bank_name },
                  {
                    label: 'Account Number',
                    value: bank.account_number
                      ? `••••••${String(bank.account_number).slice(-4)}`
                      : '—',
                  },
                  { label: 'IFSC Code', value: bank.ifsc_code },
                  { label: 'UPI ID', value: bank.upi_id || '—' },
                ].map((item, i) => (
                  <div key={i} className="info-item">
                    <div className="info-label">{item.label}</div>
                    <div className="info-value">{item.value || '—'}</div>
                  </div>
                ))}
              </div>
              {bank.cheque_file && (
                <div style={{ marginTop: 20 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setLightbox({ images: [bank.cheque_file], index: 0 })}
                  >
                    <ExternalLink size={14} /> View Cheque Document
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 3 — Listings */}
      {activeTab === 'listings' && (
        <div className="table-wrapper">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Image</th><th>Title</th><th>Category</th>
                  <th>Price</th><th>Status</th><th>Created</th>
                </tr>
              </thead>
              <tbody>
                {vendor.listings?.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state">No listings</div></td></tr>
                ) : vendor.listings?.map((l: any) => (
                  <tr key={l.id}>
                    <td>
                      {l.image_1 ? (
                        <img
                          src={getImageUrl(l.image_1)}
                          className="listing-thumb"
                          onClick={() => {
                            const imgs = [l.image_1, l.image_2, l.image_3].filter(Boolean);
                            setLightbox({ images: imgs, index: 0 });
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      ) : <span>—</span>}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.listing_title}</td>
                    <td><span className="service-pill">{l.category}</span></td>
                    <td>{formatINR(l.price)}</td>
                    <td><StatusBadge status={l.status || 'active'} /></td>
                    <td>{formatDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4 — Bookings */}
      {activeTab === 'bookings' && (
        <div className="table-wrapper">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th><th>Customer</th><th>Listing</th>
                  <th>Date</th><th>Amount</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vendor.bookings?.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state">No bookings</div></td></tr>
                ) : vendor.bookings?.map((b: any) => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{String(b.id).slice(0, 8)}</td>
                    <td>{b.user_name || '—'}</td>
                    <td>{b.listing_title || '—'}</td>
                    <td>{formatDate(b.start_date)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatINR(b.total_amount)}</td>
                    <td><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(vendor.bookings?.length ?? 0) > 0 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{vendor.bookings?.length} bookings</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                {formatINR(vendor.bookings?.reduce((s: number, b: any) => s + parseFloat(b.total_amount || 0), 0))} total
              </span>
            </div>
          )}
        </div>
      )}

      {/* TAB 5 — Reviews */}
      {activeTab === 'reviews' && (
        <div>
          {vendor.reviews?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⭐</div>
              <div className="empty-state-text">No reviews yet</div>
            </div>
          ) : vendor.reviews?.map((r: any) => (
            <div key={r.id} className="review-card">
              <div className="review-header">
                <div>
                  <div className="review-stars">{renderStars(r.rating)}</div>
                  <div className="reviewer-name">{r.reviewer_name || r.user_name || 'Customer'}</div>
                </div>
                <div className="review-date">{formatDate(r.created_at)}</div>
              </div>
              <div className="review-text">{r.comment}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                For: {r.listing_title}
              </div>
              {r.vendor_reply && (
                <div className="review-reply">
                  <strong>Vendor Reply:</strong> {r.vendor_reply}
                </div>
              )}
              {r.images && r.images.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {r.images.map((img: string, i: number) => (
                    <img
                      key={i}
                      src={getImageUrl(img)}
                      style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => setLightbox({ images: r.images, index: i })}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 6 — Earnings */}
      {activeTab === 'earnings' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Earned (Paid)', value: formatINR(vendor.stats?.totalRevenue), color: 'var(--success)' },
              { label: 'Pending', value: formatINR(vendor.stats?.totalPending), color: 'var(--warning)' },
              { label: 'Total Transactions', value: vendor.earnings?.length ?? 0, color: 'var(--accent-purple)' },
            ].map((s, i) => (
              <div key={i} className="card card-sm" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="table-wrapper">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th><th>Booking ID</th><th>Amount</th><th>Type</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vendor.earnings?.length === 0 ? (
                    <tr><td colSpan={5}><div className="empty-state">No earnings yet</div></td></tr>
                  ) : vendor.earnings?.map((e: any) => (
                    <tr key={e.id}>
                      <td>{formatDate(e.created_at)}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{String(e.booking_id).slice(0, 8)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatINR(e.amount)}</td>
                      <td><span className="service-pill">{e.type}</span></td>
                      <td><StatusBadge status={e.status || 'pending'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <ImageViewer
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Approve Modal */}
      <ConfirmModal
        isOpen={confirmModal?.type === 'approve' && !!confirmModal?.open}
        title="Approve Vendor"
        message={`Approve "${vendor.company_name}"? They will be able to start receiving bookings immediately.`}
        onConfirm={handleApprove}
        onCancel={() => setConfirmModal(null)}
        variant="success"
        confirmLabel="✅ Approve Vendor"
        isLoading={actionLoading}
      />

      {/* Reject Modal */}
      <ConfirmModal
        isOpen={confirmModal?.type === 'reject' && !!confirmModal?.open}
        title="Reject Vendor"
        message={`Reject "${vendor.company_name}"? Please give a detailed reason.`}
        onConfirm={(reason) => handleReject(id, reason)}
        onCancel={() => { setConfirmModal(null); setRejectReason(''); }}
        variant="danger"
        confirmLabel="❌ Reject Vendor"
        withReason
        reasonPlaceholder="e.g., Documents are unclear, PAN card is missing..."
        isLoading={actionLoading}
        reason={rejectReason}
        onReasonChange={setRejectReason}
      />
    </>
  );
}
