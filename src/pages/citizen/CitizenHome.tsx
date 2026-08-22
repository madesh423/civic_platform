import { useNavigate } from 'react-router-dom';
import { PlusCircle, ClipboardList, TrendingUp, ThumbsUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useReports } from '@/lib/hooks';
import { ReportCard } from '@/components/ReportCard';
import { Card, KpiCard, Spinner } from '@/components/ui';
import { STATUS_META } from '@/lib/constants';
import { t } from '@/lib/i18n';
import type { ReportStatus } from '@/lib/types';

export function CitizenHome() {
  const { profile, lang } = useAuth();
  const navigate = useNavigate();
  const { reports, loading } = useReports({ limit: 20 });

  const myReports = reports.filter((r) => r.reporter_id === profile?.id);
  const openCount = myReports.filter((r) => !['RESOLVED', 'REJECTED', 'DUPLICATE'].includes(r.status)).length;
  const resolvedCount = myReports.filter((r) => r.status === 'RESOLVED').length;
  const recentReports = reports.slice(0, 8);
  const statusCounts = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          {lang === 'TA' ? `வணக்கம், ${profile?.name}` : `Welcome, ${profile?.name}`}
        </h1>
        <p className="text-sm text-slate-500">{profile?.ward}</p>
      </div>

      <button
        onClick={() => navigate('/app/report')}
        className="flex w-full items-center gap-3 rounded-xl bg-emerald-600 p-4 text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
          <PlusCircle size={24} />
        </div>
        <div className="text-left">
          <div className="text-base font-bold">{t('reportIssue', lang)}</div>
          <div className="text-xs text-emerald-100">
            {lang === 'TA' ? 'உங்கள் பகுதியில் பிரச்சனையை புகார் செய்யவும்' : 'Report an issue in your area'}
          </div>
        </div>
      </button>

      <div className="grid grid-cols-3 gap-2">
        <KpiCard label={t('myReports', lang)} value={myReports.length} icon={ClipboardList} color="#2563eb" />
        <KpiCard label={t('open', lang)} value={openCount} icon={TrendingUp} color="#f59e0b" />
        <KpiCard label={t('resolvedThisWeek', lang)} value={resolvedCount} icon={PlusCircle} color="#16a34a" />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            {lang === 'TA' ? 'அண்மை புகார்கள்' : 'Recent Reports'}
          </h2>
          <button onClick={() => navigate('/app/nearby')} className="text-xs font-medium text-emerald-600">
            {lang === 'TA' ? 'அனைத்தும்' : 'See all'}
          </button>
        </div>
        {loading ? (
          <Spinner className="py-8" />
        ) : recentReports.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-400">{t('noReports', lang)}</Card>
        ) : (
          <div className="space-y-2">
            {recentReports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </div>

      {Object.keys(statusCounts).length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            {lang === 'TA' ? 'சமூக நிலை' : 'Community Status'}
          </h3>
          <div className="space-y-2">
            {(Object.entries(statusCounts) as [ReportStatus, number][])
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_META[status].color }} />
                    <span className="text-slate-600">{lang === 'TA' ? STATUS_META[status].labelTa : STATUS_META[status].label}</span>
                  </span>
                  <span className="font-semibold text-slate-700">{count}</span>
                </div>
              ))}
          </div>
        </Card>
      )}

      <Card className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <ThumbsUp size={20} />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-700">{t('reputation', lang)}</div>
          <div className="text-xs text-slate-500">{profile?.reputation_score ?? 0} points</div>
        </div>
      </Card>
    </div>
  );
}
