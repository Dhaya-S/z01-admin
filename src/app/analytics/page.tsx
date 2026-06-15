'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  CartesianGrid,
} from 'recharts';
import { adminApi } from '@/lib/api';
import { formatINR } from '@/lib/formatters';

const PURPLE = '#7c3aed';
const INDIGO = '#4f46e5';
const GREEN = '#10b981';
const AMBER = '#f59e0b';
const RED = '#ef4444';

const CATEGORY_COLORS: Record<string, string> = {
  Studio: PURPLE,
  Equipment: INDIGO,
  Manpower: GREEN,
};

const tooltipStyle = {
  contentStyle: {
    background: '#14141f',
    border: '1px solid #1e1e32',
    borderRadius: 10,
    color: '#f1f5f9',
    fontSize: 13,
  },
};

const axisStyle = { fill: '#64748b', fontSize: 11 };

export default function AnalyticsPage() {
  const [revenue, setRevenue] = useState<any>(null);
  const [bookings, setBookings] = useState<any>(null);
  const [topVendors, setTopVendors] = useState<any[]>([]);
  const [growth, setGrowth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getRevenueAnalytics(),
      adminApi.getBookingAnalytics(),
      adminApi.getTopVendors(),
      adminApi.getGrowthAnalytics(),
    ])
      .then(([r, b, t, g]) => {
        setRevenue(r.data);
        setBookings(b.data);
        setTopVendors(t.data);
        setGrowth(g.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categoryData = (bookings?.byCategory || []).map((c: any) => ({
    name: c.category || 'Unknown',
    bookings: parseInt(c.bookings),
    revenue: parseFloat(c.revenue),
  }));

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <div className="page-subtitle">Platform performance metrics and growth trends</div>
        </div>
      </div>

      {/* ── Section 1: Revenue Overview ── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
          💰 Revenue Overview
        </h2>
        <div className="analytics-summary">
          <div className="summary-card">
            <div className="summary-value">{formatINR(revenue?.totalRevenue ?? 0)}</div>
            <div className="summary-label">Total Revenue (all time)</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{formatINR(revenue?.avgMonthlyRevenue ?? 0)}</div>
            <div className="summary-label">Avg Monthly Revenue</div>
          </div>
          <div className="summary-card">
            <div className="summary-value" style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {(revenue?.monthly || []).length}
            </div>
            <div className="summary-label">Months of Data</div>
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Monthly Revenue — Last 12 Months</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenue?.monthly || []} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e32" vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={70} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [formatINR(v), 'Revenue']} />
              <Bar dataKey="revenue" fill="url(#revGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PURPLE} />
                  <stop offset="100%" stopColor={INDIGO} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 2: Booking Trends ── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
          📅 Booking Trends
        </h2>
        <div className="charts-grid charts-grid-2">
          <div className="chart-card">
            <div className="chart-title">Bookings Per Day — Last 30 Days</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={bookings?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e32" vertical={false} />
                <XAxis dataKey="day" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={28} />
                <Tooltip {...tooltipStyle} />
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PURPLE} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="bookings" stroke={PURPLE} strokeWidth={2.5} fill="url(#areaGradient)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-title">Category Distribution</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} dataKey="bookings" nameKey="name" cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {categoryData.map((entry: any, i: number) => (
                    <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>} />
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Section 3: Category Revenue ── */}
      {categoryData.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
            🏢 Revenue by Category
          </h2>
          <div className="chart-card">
            <div className="chart-title">Category Comparison (Bookings & Revenue)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} layout="vertical" barSize={20} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e32" horizontal={false} />
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={axisStyle} axisLine={false} tickLine={false} width={90} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="bookings" fill={PURPLE} radius={[0, 4, 4, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Section 4: Top Vendors ── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
          🏆 Top Vendors by Revenue
        </h2>
        {topVendors.length > 0 && (
          <div className="chart-card" style={{ marginBottom: 20 }}>
            <div className="chart-title">Top 10 Vendors</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topVendors} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e32" horizontal={false} />
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <YAxis dataKey="company_name" type="category" tick={axisStyle} axisLine={false} tickLine={false} width={130} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [formatINR(v), 'Revenue']} />
                <Bar dataKey="total_revenue" fill="url(#revGradient)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="table-wrapper">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Rank</th><th>Vendor</th><th>Bookings</th><th>Revenue</th><th>Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {topVendors.map((v: any, i: number) => (
                  <tr key={v.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: i < 3 ? AMBER : 'var(--text-muted)' }}>
                        #{i + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.company_name}</td>
                    <td>{v.total_bookings}</td>
                    <td style={{ color: GREEN, fontWeight: 600 }}>{formatINR(v.total_revenue)}</td>
                    <td style={{ color: AMBER }}>{parseFloat(v.avg_rating || 0).toFixed(1)} ★</td>
                  </tr>
                ))}
                {topVendors.length === 0 && (
                  <tr><td colSpan={5}><div className="empty-state">No vendor data yet</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Section 5: User Growth ── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
          📈 Platform Growth
        </h2>
        <div className="charts-grid charts-grid-2">
          <div className="chart-card">
            <div className="chart-title">New Users Per Month</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={growth?.userGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e32" vertical={false} />
                <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={30} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="new_users" stroke={GREEN} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-title">New Vendors Per Month</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={growth?.vendorGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e32" vertical={false} />
                <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={30} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="new_vendors" stroke={AMBER} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="New Vendors" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
