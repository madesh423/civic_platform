import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useReports } from '@/lib/hooks';
import { ReportCard } from '@/components/ReportCard';
import { OorfixMap } from '@/components/OorfixMap';
import { Card, Spinner } from '@/components/ui';
import { STATUS_META } from '@/lib/constants';
import { t } from '@/lib/i18n';
import type { ReportStatus } from '@/lib/types';

const STATUS_FILTERS: (ReportStatus | 'ALL')[] = [
  'ALL', 'SUBMITTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED',
];

export function NearbyPage() {
  const { lang } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [view, setView] = useState<'list' | 'map'>('list');
  const { reports, loading } = useReports({ status: statusFilter });

  const filtered = reports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.address_text.toLowerCase().includes(q)
    );
  });

  const pins = filtered.map((r) => ({
    id: r.id,
    lat: r.latitude,
    lng: r.longitude,
    title: r.title,
    status: r.status,
    category: r.category ?? null,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">{t('nearby', lang)}</h1>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search', lang)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex rounded-lg border border-slate-300">
          <button
            onClick={() => setView('list')}
            className={`rounded-l-lg px-3 py-2 text-sm font-medium ${view === 'list' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
          >
            List
          </button>
          <button
            onClick={() => setView('map')}
            className={`rounded-r-lg px-3 py-2 text-sm font-medium ${view === 'map' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
          >
            Map
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
              statusFilter === s
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {s === 'ALL' ? t('all', lang) : lang === 'TA' ? STATUS_META[s].labelTa : STATUS_META[s].label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner className="py-8" />
      ) : view === 'map' ? (
        <Card className="overflow-hidden">
          <OorfixMap pins={pins} height="500px" />
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-400">{t('noReports', lang)}</Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}
