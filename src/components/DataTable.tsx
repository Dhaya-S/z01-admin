'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  totalCount?: number;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  externalSearch?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  actions?: React.ReactNode;
  hideSearch?: boolean;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <div className="skeleton" style={{ height: 16, width: '70%' }} />
        </td>
      ))}
    </tr>
  );
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  totalCount,
  page = 1,
  limit = 20,
  onPageChange,
  searchPlaceholder = 'Search...',
  onSearch,
  externalSearch,
  onRowClick,
  emptyMessage = 'No data found',
  actions,
  hideSearch,
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleSearch = (q: string) => {
    setLocalSearch(q);
    if (onSearch) onSearch(q);
  };

  const filteredData = useMemo(() => {
    let d = [...data];
    if (!externalSearch && localSearch) {
      const q = localSearch.toLowerCase();
      d = d.filter(row =>
        Object.values(row).some(v =>
          String(v ?? '').toLowerCase().includes(q),
        ),
      );
    }
    if (sortKey) {
      d.sort((a, b) => {
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return d;
  }, [data, localSearch, sortKey, sortDir, externalSearch]);

  const total = totalCount ?? filteredData.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const exportCSV = () => {
    const headers = columns.map(c => c.header).join(',');
    const rows = filteredData.map(row =>
      columns.map(c => {
        const val = c.key.split('.').reduce((o, k) => o?.[k], row);
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      }).join(','),
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="table-wrapper">
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          {!hideSearch && (
            <div className="input-with-icon">
              <Search size={15} className="input-icon" />
              <input
                className="input"
                style={{ minWidth: 220 }}
                placeholder={searchPlaceholder}
                value={localSearch}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>
          )}
          {actions}
        </div>
        <div className="table-toolbar-right">
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {col.header}
                    {col.sortable !== false && sortKey === col.key ? (
                      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <div className="empty-state-text">{emptyMessage}</div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick?.(row)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map(col => {
                    const val = col.key.split('.').reduce<any>((o, k) => o?.[k], row);
                    return (
                      <td key={col.key}>
                        {col.render ? col.render(val, row, rowIdx) : String(val ?? '—')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-pagination">
        <div className="pagination-info">
          {total > 0 ? `Showing ${start}–${end} of ${total}` : '0 results'}
        </div>
        {totalPages > 1 && onPageChange && (
          <div className="pagination-controls">
            <button
              className="page-btn"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft size={14} />
            </button>
            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>
              ) : (
                <button
                  key={p}
                  className={`page-btn ${page === p ? 'active' : ''}`}
                  onClick={() => onPageChange(p as number)}
                >
                  {p}
                </button>
              ),
            )}
            <button
              className="page-btn"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
