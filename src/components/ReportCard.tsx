import { useNavigate } from 'react-router-dom';
import { MapPin, ThumbsUp, Clock } from 'lucide-react';
import type { ReportWithRelations } from '@/lib/types';
import { CategoryIcon, StatusChip, SeverityChip } from '@/components/ui';
import { timeAgo, isOverdue } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export function ReportCard({ report }: { report: ReportWithRelations }) {
  const navigate = useNavigate();
  const { lang, session } = useAuth();
  const overdue = isOverdue(report.sla_deadline_at, report.status);
  const media = report.media ?? [];
  const firstImage = media.find((m) => m.before_after === 'BEFORE') ?? media[0];

  return (
    <button
      onClick={() => navigate(`/app/report/${report.id}`)}
      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:shadow-md hover:border-slate-300"
    >
      <div className="flex gap-3">
        {firstImage ? (
          <img
            src={firstImage.storage_url}
            alt={report.title}
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <CategoryIcon category={report.category ?? null} size={28} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-800">{report.title}</h3>
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{report.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusChip status={report.status} />
            <SeverityChip severity={report.severity} />
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
              <span className="truncate">{report.address_text || 'Unknown'}</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-0.5">
                <ThumbsUp size={11} />
                {report.upvotes_count}
              </span>
              <span>{timeAgo(report.created_at, lang === 'TA' ? 'ta' : 'en')}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export function ReportList({ reports }: { reports: ReportWithRelations[] }) {
  if (reports.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-slate-400">No reports found.</div>
    );
  }
  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <ReportCard key={r.id} report={r} />
      ))}
    </div>
  );
}
