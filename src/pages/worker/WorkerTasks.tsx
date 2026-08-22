import { useNavigate } from 'react-router-dom';
import { ClipboardList, MapPin, Clock, CheckCircle2, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMyAssignments } from '@/lib/hooks';
import { Card, Spinner, EmptyState, StatusChip, CategoryIcon } from '@/components/ui';
import { OorfixMap } from '@/components/OorfixMap';
import { timeAgo, isOverdue, formatDate, classNames } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { useState } from 'react';
import type { AssignmentWithRelations } from '@/lib/types';

export function WorkerTasks() {
  const { profile, lang } = useAuth();
  const navigate = useNavigate();
  const { assignments, loading } = useMyAssignments(profile?.id);
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');

  if (loading) return <Spinner className="py-20" />;

  const filtered = assignments.filter((a) => {
    if (!a.report) return false;
    const status = a.report.status;
    if (filter === 'active') return !['RESOLVED', 'REJECTED', 'DUPLICATE'].includes(status);
    if (filter === 'completed') return status === 'RESOLVED';
    return true;
  });

  const activeCount = assignments.filter((a) => a.report && !['RESOLVED', 'REJECTED', 'DUPLICATE'].includes(a.report.status)).length;
  const completedCount = assignments.filter((a) => a.report?.status === 'RESOLVED').length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{t('myTasks', lang)}</h1>
        <p className="text-sm text-slate-500">{profile?.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-amber-600">
            <Clock size={20} />
            {activeCount}
          </div>
          <div className="text-xs text-slate-500">{t('open', lang)}</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-green-600">
            <CheckCircle2 size={20} />
            {completedCount}
          </div>
          <div className="text-xs text-slate-500">{t('completed', lang)}</div>
        </Card>
      </div>

      <div className="flex gap-1.5">
        {(['active', 'completed', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={classNames(
              'flex-1 rounded-lg py-1.5 text-xs font-medium capitalize',
              filter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title={t('noTasks', lang)} />
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <AssignmentCard key={a.id} assignment={a} onClick={() => navigate(`/app/report/${a.report?.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentCard({
  assignment,
  onClick,
}: {
  assignment: AssignmentWithRelations;
  onClick: () => void;
}) {
  const { lang } = useAuth();
  const report = assignment.report;
  if (!report) return null;
  const overdue = isOverdue(report.sla_deadline_at, report.status);

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex gap-3">
        <CategoryIcon category={report.category ?? null} size={24} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-800">{report.title}</h3>
          <div className="mt-1 flex items-center gap-2">
            <StatusChip status={report.status} />
            {overdue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                <Clock size={10} />
                {lang === 'TA' ? 'காலதாமதம்' : 'Overdue'}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              <span className="truncate">{report.address_text}</span>
            </span>
            {report.sla_deadline_at && report.status !== 'RESOLVED' && (
              <span className="shrink-0">{formatDate(report.sla_deadline_at)}</span>
            )}
          </div>
          {(assignment.rating_by_citizen || assignment.rating_by_admin) && (
            <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
              <Star size={12} className="fill-amber-400" />
              {assignment.rating_by_citizen ?? assignment.rating_by_admin}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
