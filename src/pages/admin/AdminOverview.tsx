import { useAuth } from '@/context/AuthContext';
import { useReports } from '@/lib/hooks';
import { Card, KpiCard, Spinner } from '@/components/ui';
import { ReportList } from '@/components/ReportCard';
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Building2,
} from 'lucide-react';
import { STATUS_META } from '@/lib/constants';
import { isOverdue } from '@/lib/utils';
import { t } from '@/lib/i18n';
import type { ReportStatus } from '@/lib/types';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, WorkerProfile } from '@/lib/types';

export function AdminOverview() {
  const { lang } = useAuth();
  const { reports, loading } = useReports({ limit: 50 });
  const [workers, setWorkers] = useState<(WorkerProfile & { name: string })[]>([]);
  const [deptCount, setDeptCount] = useState(0);

  useEffect(() => {
    supabase.from('worker_profiles').select('*, user_id').then(async ({ data }) => {
      const wp = (data ?? []) as WorkerProfile[];
      const ids = wp.map((w) => w.user_id);
      if (ids.length === 0) return;
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', ids);
      const profMap = new Map((profs as Profile[])?.map((p) => [p.id, p.name]) ?? []);
      setWorkers(wp.map((w) => ({ ...w, name: profMap.get(w.user_id) ?? 'Unknown' })));
    });
    supabase.from('departments').select('id', { count: 'exact', head: true }).then(({ count }) => {
      setDeptCount(count ?? 0);
    });
  }, []);

  if (loading) return <Spinner className="py-20" />;

  const openCount = reports.filter((r) => !['RESOLVED', 'REJECTED', 'DUPLICATE'].includes(r.status)).length;
  const overdueCount = reports.filter((r) => isOverdue(r.sla_deadline_at, r.status)).length;
  const resolvedToday = reports.filter(
    (r) => r.status === 'RESOLVED' && r.resolved_at && new Date(r.resolved_at).toDateString() === new Date().toDateString()
  ).length;
  const activeWorkers = workers.filter((w) => w.is_active).length;

  const statusBreakdown = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t('overview', lang)}</h1>
        <p className="text-sm text-slate-500">
          {lang === 'TA' ? 'கண்காணிப்பு பலகை' : 'Operations dashboard'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label={t('totalReports', lang)} value={reports.length} icon={ClipboardList} color="#2563eb" />
        <KpiCard label={t('open', lang)} value={openCount} icon={TrendingUp} color="#f59e0b" />
        <KpiCard label={t('overdue', lang)} value={overdueCount} icon={AlertTriangle} color="#dc2626" />
        <KpiCard label={t('resolvedToday', lang)} value={resolvedToday} icon={CheckCircle2} color="#16a34a" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard label={t('activeWorkers', lang)} value={activeWorkers} icon={Users} color="#0891b2" />
        <KpiCard label={t('workers', lang)} value={workers.length} icon={Users} color="#6366f1" />
        <KpiCard label={t('departments', lang)} value={deptCount} icon={Building2} color="#7c3aed" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            {lang === 'TA' ? 'நிலை பகுப்பாய்வு' : 'Status Breakdown'}
          </h3>
          <div className="space-y-2">
            {(Object.entries(statusBreakdown) as [ReportStatus, number][])
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => {
                const pct = reports.length > 0 ? (count / reports.length) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_META[status].color }} />
                        <span className="text-slate-600">
                          {lang === 'TA' ? STATUS_META[status].labelTa : STATUS_META[status].label}
                        </span>
                      </span>
                      <span className="font-semibold text-slate-700">{count}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: STATUS_META[status].color }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            {lang === 'TA' ? 'கவனம் தேவை' : 'Needs Attention'}
          </h3>
          <div className="space-y-2">
            {reports.filter((r) => isOverdue(r.sla_deadline_at, r.status)).slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs">
                <Clock size={14} className="text-red-500" />
                <span className="truncate text-slate-700">{r.title}</span>
              </div>
            ))}
            {reports.filter((r) => isOverdue(r.sla_deadline_at, r.status)).length === 0 && (
              <p className="text-xs text-slate-400">
                {lang === 'TA' ? 'காலதாமதம் இல்லை' : 'No overdue items'}
              </p>
            )}
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          {lang === 'TA' ? 'சமீபத்திய புகார்கள்' : 'Recent Reports'}
        </h2>
        <div className="space-y-2">
          <ReportList reports={reports.slice(0, 8)} />
        </div>
      </div>
    </div>
  );
}
