import { useState } from 'react';
import { Search, Download, Zap, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useReports, useCategories } from '@/lib/hooks';
import { Card, Spinner, StatusChip, SeverityChip, CategoryIcon, Button } from '@/components/ui';
import { STATUS_META } from '@/lib/constants';
import { downloadCsv, timeAgo } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { supabase, EDGE_AUTO_ASSIGN } from '@/lib/supabase';
import type { ReportStatus } from '@/lib/types';

export function AdminReports() {
  const { lang, session } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const { categories } = useCategories();
  const { reports, loading, refetch } = useReports({ status: statusFilter, categoryId: categoryFilter });
  const [assigning, setAssigning] = useState<string | null>(null);

  const filtered = reports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.address_text.toLowerCase().includes(q)
    );
  });

  const handleAutoAssign = async (reportId: string) => {
    setAssigning(reportId);
    try {
      await fetch(EDGE_AUTO_ASSIGN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ report_id: reportId }),
      });
      refetch();
    } finally {
      setAssigning(null);
    }
  };

  const handleExport = () => {
    const rows = filtered.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      severity: r.severity,
      category: r.category?.name ?? '',
      department: r.assigned_department?.name ?? '',
      worker: r.assigned_worker?.name ?? '',
      ward: r.reporter?.ward ?? '',
      upvotes: r.upvotes_count,
      created: r.created_at,
    }));
    downloadCsv('reports.csv', rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('reports', lang)}</h1>
          <p className="text-sm text-slate-500">{filtered.length} {lang === 'TA' ? 'புகார்கள்' : 'reports'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download size={14} />
          {t('exportCsv', lang)}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search', lang)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'ALL')}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          <option value="ALL">{t('all', lang)}</option>
          {(Object.keys(STATUS_META) as ReportStatus[]).map((s) => (
            <option key={s} value={s}>
              {lang === 'TA' ? STATUS_META[s].labelTa : STATUS_META[s].label}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          <option value="ALL">{t('all', lang)}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Spinner className="py-20" />
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-400">{t('noReports', lang)}</Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Report</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Severity</th>
                <th className="px-3 py-2 font-medium">Worker</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="max-w-[200px] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <CategoryIcon category={r.category ?? null} size={16} />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-800">{r.title}</div>
                        <div className="truncate text-xs text-slate-400">{r.address_text}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2"><StatusChip status={r.status} /></td>
                  <td className="px-3 py-2"><SeverityChip severity={r.severity} /></td>
                  <td className="px-3 py-2 text-xs text-slate-600">{r.assigned_worker?.name ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-slate-400">{timeAgo(r.created_at, lang === 'TA' ? 'ta' : 'en')}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/app/report/${r.id}`)}
                        className="rounded p-1 text-slate-500 hover:bg-slate-200"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      {r.status === 'SUBMITTED' && (
                        <button
                          onClick={() => handleAutoAssign(r.id)}
                          disabled={assigning === r.id}
                          className="rounded p-1 text-amber-600 hover:bg-amber-100"
                          title="Auto-Assign"
                        >
                          <Zap size={16} className={assigning === r.id ? 'animate-spin' : ''} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
