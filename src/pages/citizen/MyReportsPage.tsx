import { useAuth } from '@/context/AuthContext';
import { useReports } from '@/lib/hooks';
import { ReportList } from '@/components/ReportCard';
import { Spinner, EmptyState } from '@/components/ui';
import { ClipboardList } from 'lucide-react';
import { t } from '@/lib/i18n';

export function MyReportsPage() {
  const { profile, lang } = useAuth();
  const { reports, loading } = useReports({ reporterId: profile?.id });

  if (loading) return <Spinner className="py-20" />;
  if (reports.length === 0)
    return (
      <EmptyState
        icon={ClipboardList}
        title={t('noReports', lang)}
        description={lang === 'TA' ? 'நீங்கள் எந்த புகாரும் செய்யவில்லை' : 'You have not reported any issues yet'}
      />
    );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">{t('myReports', lang)}</h1>
      <ReportList reports={reports} />
    </div>
  );
}
