import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMyAssignments } from '@/lib/hooks';
import { OorfixMap } from '@/components/OorfixMap';
import { Card, Spinner, EmptyState } from '@/components/ui';
import { MapPin } from 'lucide-react';
import { t } from '@/lib/i18n';

export function WorkerTasksMap() {
  const { profile, lang } = useAuth();
  const navigate = useNavigate();
  const { assignments, loading } = useMyAssignments(profile?.id);

  if (loading) return <Spinner className="py-20" />;

  const activeAssignments = assignments.filter(
    (a) => a.report && !['RESOLVED', 'REJECTED', 'DUPLICATE'].includes(a.report.status)
  );

  if (activeAssignments.length === 0)
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-slate-800">{t('nearby', lang)}</h1>
        <EmptyState icon={MapPin} title={t('noTasks', lang)} />
      </div>
    );

  const pins = activeAssignments
    .filter((a) => a.report)
    .map((a) => ({
      id: a.report!.id,
      lat: a.report!.latitude,
      lng: a.report!.longitude,
      title: a.report!.title,
      status: a.report!.status,
      category: a.report!.category ?? null,
    }));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">{t('nearby', lang)}</h1>
      <Card className="overflow-hidden">
        <OorfixMap pins={pins} height="500px" onPinClick={(id) => navigate(`/app/report/${id}`)} />
      </Card>
      <p className="text-center text-xs text-slate-400">
        {activeAssignments.length} {lang === 'TA' ? 'செயலில் உள்ள பணிகள்' : 'active tasks on map'}
      </p>
    </div>
  );
}
