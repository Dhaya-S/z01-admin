'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store, Clock, CalendarCheck, IndianRupee,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import StatsCard from '@/components/StatsCard';
import StatusBadge from '@/components/StatusBadge';
import { adminApi } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/formatters';

const PIE_COLORS = {
  confirmed: '#6366f1',
  completed: '#10b981',
  pending: '#f59e0b',
  cancelled: '#ef4444',
  delivered: '#14b8a6',
  disputed: '#f97316',
};

export default function DashboardChartsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [bookingAnalytics, setBookingAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.getStats(), adminApi.getBookingAnalytics()])
      .then(([statsRes, analyticsRes]) => {
        setStats(statsRes.data);
        setBookingAnalytics(analyticsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pieData = (bookingAnalytics?.byStatus || []).map((s: any) => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: parseInt(s.count),
    status: s.status,
  }));

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading charts...</div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">High-Signal Dashboard</h1>
          <div className="page-subtitle">Detailed KPIs, analytics, and platform charts</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <StatsCard
          title="Total Vendors"
          value={stats?.totalVendors ?? 0}
          icon={Store}
          color="purple"
          trend={`${stats?.approvedVendors ?? 0} approved`}
        />
        <StatsCard
          title="Pending Approval"
          value={stats?.submittedVendors ?? 0}
          icon={Clock}
          color="amber"
          urgent={(stats?.submittedVendors ?? 0) > 0}
          trend={(stats?.submittedVendors ?? 0) > 0 ? '⚠️ Action required' : 'All clear'}
        />
        <StatsCard
          title="Bookings This Month"
          value={stats?.bookingsThisMonth ?? 0}
          icon={CalendarCheck}
          color="indigo"
          trend={`${stats?.totalBookings ?? 0} total`}
        />
        <StatsCard
          title="Revenue This Month"
          value={stats?.revenueThisMonth ?? 0}
          icon={IndianRupee}
          color="green"
          prefix="₹"
          trend={`₹${((stats?.totalRevenue ?? 0) / 100000).toFixed(1)}L total`}
        />
      </div>

      {/* Charts Row */}
      <div className="charts-grid charts-grid-2" style={{ marginBottom: 28 }}>
        {/* Bookings Line Chart */}
        <div className="chart-card">
          <div className="chart-title">📈 Bookings — Last 30 Days</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={bookingAnalytics?.daily || []}>
              <XAxis
                dataKey="day"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                }}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#7c3aed"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#7c3aed' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status Pie */}
        <div className="chart-card">
          <div className="chart-title">🥧 Booking Status Breakdown</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry: any, idx: number) => (
                    <Cell
                      key={idx}
                      fill={PIE_COLORS[entry.status as keyof typeof PIE_COLORS] || '#64748b'}
                    />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => (
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 220 }}>
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">No booking data</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Pending Vendors */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>⏳ Pending Vendor Approvals</div>
          </div>
          {(stats?.recentVendors || []).length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div style={{ fontSize: 32 }}>✅</div>
              <div className="empty-state-text">No pending approvals</div>
            </div>
          ) : (
            <div>
              {(stats?.recentVendors || []).map((v: any) => (
                <div
                  key={v.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '13px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                      {v.company_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {v.phone} · {formatDate(v.created_at)}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => router.push(`/vendors/${v.id}`)}
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>📋 Recent Bookings</div>
          </div>
          {(stats?.recentBookings || []).length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">No bookings yet</div>
            </div>
          ) : (
            <div>
              {(stats?.recentBookings || []).map((b: any) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '13px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                      {b.listing_title || 'Listing'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {b.user_name} · {formatINR(b.total_amount)}
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
