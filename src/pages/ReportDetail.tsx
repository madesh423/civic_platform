import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  ThumbsUp,
  Clock,
  User,
  Building2,
  Zap,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Play,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useReport, useCategories, toggleUpvote } from '@/lib/hooks';
import { Button, Card, CategoryIcon, Spinner, StatusChip, SeverityChip } from '@/components/ui';
import { OorfixMap } from '@/components/OorfixMap';
import { supabase, EDGE_AUTO_ASSIGN } from '@/lib/supabase';
import { timeAgo, formatDate, isOverdue, classNames } from '@/lib/utils';
import { uploadReportImage } from '@/lib/media';
import type { ReportStatus } from '@/lib/types';

export function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, lang, session } = useAuth();
  const { report, loading, error, refetch } = useReport(id, session?.user?.id);
  const [upvoting, setUpvoting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  if (loading) return <Spinner className="py-20" />;
  if (error) return <div className="py-20 text-center text-red-500">{error}</div>;
  if (!report)
    return (
      <div className="py-20 text-center text-slate-400">
        Report not found.
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
        </div>
      </div>
    );

  const isReporter = report.reporter_id === profile?.id;
  const isWorker = report.assigned_worker_id === profile?.id;
  const isAdmin = profile?.role === 'ADMIN';
  const canAct = isWorker || isAdmin;
  const overdue = isOverdue(report.sla_deadline_at, report.status);

  const handleUpvote = async () => {
    if (!session?.user || upvoting) return;
    setUpvoting(true);
    try {
      await toggleUpvote(report.id, session.user.id);
      refetch();
    } finally {
      setUpvoting(false);
    }
  };

  const changeStatus = async (newStatus: ReportStatus, comment?: string) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const updates: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (newStatus === 'RESOLVED') updates.resolved_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', report.id);
      if (updateError) throw updateError;

      const { error: insertError } = await supabase.from('report_updates').insert({
        report_id: report.id,
        updated_by: profile?.id,
        old_status: report.status,
        new_status: newStatus,
        comment: comment || `Status changed to ${newStatus}`,
      });
      if (insertError) throw insertError;

      refetch();
    } catch (err) {
      console.error('Status change failed', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await fetch(EDGE_AUTO_ASSIGN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ report_id: report.id }),
      });
      refetch();
    } catch (err) {
      console.error('Auto-assign failed', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadAfter = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user || uploadingAfter) return;
    setUploadingAfter(true);
    try {
      const url = await uploadReportImage(file, report.id, session.user.id);
      const { error: mediaError } = await supabase.from('report_media').insert({
        report_id: report.id,
        media_type: 'IMAGE',
        storage_url: url,
        before_after: 'AFTER',
        uploaded_by: session.user.id,
      });
      if (mediaError) throw mediaError;
      refetch();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploadingAfter(false);
    }
  };

  const beforeMedia = (report.media ?? []).filter((m) => m.before_after === 'BEFORE');
  const afterMedia = (report.media ?? []).filter((m) => m.before_after === 'AFTER');
  const updates = [...(report.updates ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} />
        {lang === 'TA' ? 'திரும்பு' : 'Back'}
      </button>

      <Card className="overflow-hidden">
        {beforeMedia[0] && (
          <img
            src={beforeMedia[0].storage_url}
            alt={report.title}
            className="h-48 w-full object-cover"
          />
        )}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {!beforeMedia[0] && <CategoryIcon category={report.category ?? null} size={24} />}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-slate-800">{report.title}</h1>
              <p className="mt-1 text-sm text-slate-600">{report.description}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusChip status={report.status} />
            <SeverityChip severity={report.severity} />
            {overdue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                <AlertTriangle size={10} />
                {lang === 'TA' ? 'காலதாமதம்' : 'Overdue'}
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin size={14} className="shrink-0" />
              <span className="truncate">{report.address_text || 'Unknown location'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Clock size={14} className="shrink-0" />
              <span>{timeAgo(report.created_at, lang === 'TA' ? 'ta' : 'en')}</span>
            </div>
            {report.reporter && (
              <div className="flex items-center gap-2 text-slate-500">
                <User size={14} className="shrink-0" />
                <span className="truncate">{report.reporter.name}</span>
              </div>
            )}
            {report.assigned_department && (
              <div className="flex items-center gap-2 text-slate-500">
                <Building2 size={14} className="shrink-0" />
                <span className="truncate">{report.assigned_department.name}</span>
              </div>
            )}
          </div>

          {report.sla_deadline_at && report.status !== 'RESOLVED' && report.status !== 'REJECTED' && (
            <div className={classNames(
              'mt-3 rounded-lg px-3 py-2 text-xs',
              overdue ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
            )}>
              {lang === 'TA' ? 'காலக்கெடு: ' : 'SLA Deadline: '}
              {formatDate(report.sla_deadline_at)}
            </div>
          )}

          <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={handleUpvote}
              disabled={upvoting}
              className={classNames(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                report.upvoted_by_me
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <ThumbsUp size={14} />
              {report.upvotes_count} {lang === 'TA' ? 'ஆதரவு' : 'Upvotes'}
            </button>
            <a
              href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}&zoom=16`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
            >
              <MapPin size={14} />
              {lang === 'TA' ? 'வரைபடம்' : 'Maps'}
            </a>
          </div>
        </div>
      </Card>

      {(beforeMedia.length > 0 || afterMedia.length > 0) && (
        <Card className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <ImageIcon size={14} />
                {lang === 'TA' ? 'பணிக்கு முன்' : 'Before'}
              </h3>
              <div className="space-y-2">
                {beforeMedia.map((m) => (
                  <img key={m.id} src={m.storage_url} alt="before" className="w-full rounded-lg" />
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <CheckCircle2 size={14} />
                {lang === 'TA' ? 'பணிக்கு பின்' : 'After'}
              </h3>
              <div className="space-y-2">
                {afterMedia.map((m) => (
                  <img key={m.id} src={m.storage_url} alt="after" className="w-full rounded-lg" />
                ))}
                {afterMedia.length === 0 && isWorker && report.status === 'IN_PROGRESS' && (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 py-6 text-xs text-slate-400 hover:border-emerald-400 hover:text-emerald-500">
                    {uploadingAfter ? 'Uploading...' : '+ Add after photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadAfter} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <OorfixMap
          center={[report.latitude, report.longitude]}
          zoom={15}
          height="250px"
          pins={[{
            id: report.id,
            lat: report.latitude,
            lng: report.longitude,
            title: report.title,
            status: report.status,
            category: report.category ?? null,
          }]}
          interactive
        />
      </Card>

      {/* Worker / Admin actions */}
      {canAct && report.status !== 'RESOLVED' && report.status !== 'REJECTED' && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            {lang === 'TA' ? 'நடவடிக்கைகள்' : 'Actions'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {isAdmin && report.status === 'SUBMITTED' && (
              <>
                <Button size="sm" variant="primary" loading={actionLoading} onClick={handleAutoAssign}>
                  <Zap size={14} />
                  {lang === 'TA' ? 'தானியங்கி ஒதுக்கு' : 'Auto-Assign'}
                </Button>
                <Button size="sm" variant="outline" loading={actionLoading} onClick={() => changeStatus('VERIFIED', 'Report verified by admin')}>
                  <CheckCircle2 size={14} />
                  {lang === 'TA' ? 'சரிபார்' : 'Verify'}
                </Button>
                <Button size="sm" variant="danger" loading={actionLoading} onClick={() => changeStatus('REJECTED', 'Report rejected by admin')}>
                  <XCircle size={14} />
                  {lang === 'TA' ? 'நிராகரி' : 'Reject'}
                </Button>
              </>
            )}
            {isWorker && report.status === 'ASSIGNED' && (
              <Button size="sm" variant="primary" loading={actionLoading} onClick={() => changeStatus('IN_PROGRESS', 'Work started')}>
                <Play size={14} />
                {lang === 'TA' ? 'தொடங்கு' : 'Start Work'}
              </Button>
            )}
            {isWorker && report.status === 'IN_PROGRESS' && (
              <Button size="sm" variant="primary" loading={actionLoading} onClick={() => changeStatus('RESOLVED', 'Work completed')}>
                <CheckCircle2 size={14} />
                {lang === 'TA' ? 'முடி' : 'Mark Resolved'}
              </Button>
            )}
            {isWorker && report.status === 'IN_PROGRESS' && !afterMedia.length && (
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200">
                <ImageIcon size={14} />
                {uploadingAfter ? 'Uploading...' : (lang === 'TA' ? 'படம் சேர்' : 'Add After Photo')}
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadAfter} />
              </label>
            )}
          </div>
        </Card>
      )}

      {/* Status timeline */}
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          {lang === 'TA' ? 'நிலை காலக்கெடு' : 'Status Timeline'}
        </h3>
        {updates.length === 0 ? (
          <p className="text-xs text-slate-400">No updates yet.</p>
        ) : (
          <div className="space-y-3">
            {updates.map((u, i) => (
              <div key={u.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                    <div className="h-2 w-2 rounded-full bg-emerald-600" />
                  </div>
                  {i < updates.length - 1 && <div className="h-full w-px bg-slate-200" />}
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-2">
                    {u.old_status && <StatusChip status={u.old_status} />}
                    {u.new_status && <StatusChip status={u.new_status} />}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{u.comment}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {u.updater?.name ?? 'Unknown'} · {timeAgo(u.created_at, lang === 'TA' ? 'ta' : 'en')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* AI info */}
      {report.ai_confidence > 0 && (
        <Card className="p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Zap size={12} className="text-amber-500" />
            {lang === 'TA' ? 'AI பகுப்பாய்வு' : 'AI Analysis'}: {Math.round(report.ai_confidence * 100)}% confidence
            {report.ai_severity && <SeverityChip severity={report.ai_severity} />}
          </div>
        </Card>
      )}
    </div>
  );
}
