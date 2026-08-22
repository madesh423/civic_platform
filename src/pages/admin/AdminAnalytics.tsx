import { useEffect, useState } from 'react';
import { TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { Card, Spinner, KpiCard } from '@/components/ui';
import { STATUS_META, SEVERITY_META } from '@/lib/constants';
import { isOverdue } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { Report, ReportStatus, SeverityLevel } from '@/lib/types';

export function AdminAnalytics() {
  const { lang } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setReports((data as Report[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <Spinner className="py-20" />;

  const total = reports.length;
  const resolved = reports.filter((r) => r.status === 'RESOLVED');
  const overdue = reports.filter((r) => isOverdue(r.sla_deadline_at, r.status));
  const onTime = resolved.filter((r) => r.sla_deadline_at && r.resolved_at && new Date(r.resolved_at) <= new Date(r.sla_deadline_at));
  const resolutionRate = total > 0 ? Math.round((resolved.length / total) * 100) : 0;
  const onTimeRate = resolved.length > 0 ? Math.round((onTime.length / resolved.length) * 100) : 0;

  const avgResolutionHours = (() => {
    if (resolved.length === 0) return 0;
    const totalHours = resolved.reduce((sum, r) => {
      if (!r.resolved_at) return sum;
      return sum + (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / 3600000;
    }, 0);
    return Math.round((totalHours / resolved.length) * 10) / 10;
  })();

  const statusData = (Object.keys(STATUS_META) as ReportStatus[]).map((s) => ({
    name: lang === 'TA' ? STATUS_META[s].labelTa : STATUS_META[s].label,
    count: reports.filter((r) => r.status === s).length,
    color: STATUS_META[s].color,
  })).filter((d) => d.count > 0);

  const severityData = (Object.keys(SEVERITY_META) as SeverityLevel[]).map((s) => ({
    name: lang === 'TA' ? SEVERITY_META[s].labelTa : SEVERITY_META[s].label,
    count: reports.filter((r) => r.severity === s).length,
    color: SEVERITY_META[s].color,
  }));

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toDateString();
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      reports: reports.filter((r) => new Date(r.created_at).toDateString() === dayStr).length,
      resolved: resolved.filter((r) => r.resolved_at && new Date(r.resolved_at).toDateString() === dayStr).length,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t('analytics', lang)}</h1>
        <p className="text-sm text-slate-500">
          {lang === 'TA' ? 'செயல்திறன் பகுப்பாய்வு' : 'Performance analytics'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label={t('totalReports', lang)} value={total} icon={TrendingUp} color="#2563eb" />
        <KpiCard label={t('resolvedThisWeek', lang)} value={resolved.length} icon={CheckCircle2} color="#16a34a" />
        <KpiCard label={t('overdue', lang)} value={overdue.length} icon={AlertTriangle} color="#dc2626" />
        <KpiCard label={t('avgResolution', lang)} value={`${avgResolutionHours}h`} icon={Clock} color="#f59e0b" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">
            {lang === 'TA' ? 'நிலை விநியோகம்' : 'Status Distribution'}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(props: { name?: string; count?: number }) => `${props.name}: ${props.count}`}
                labelLine={false}
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">
            {lang === 'TA' ? 'தீவிரம் விநியோகம்' : 'Severity Distribution'}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {severityData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-4 text-sm font-semibold text-slate-700">
          {lang === 'TA' ? 'கடந்த 7 நாட்கள்' : 'Last 7 Days Trend'}
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={last7Days}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="reports" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} name="Reports" />
            <Line type="monotone" dataKey="resolved" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} name="Resolved" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{resolutionRate}%</div>
          <div className="mt-1 text-xs text-slate-500">{lang === 'TA' ? 'தீர்வு விகிதம்' : 'Resolution Rate'}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{onTimeRate}%</div>
          <div className="mt-1 text-xs text-slate-500">{t('onTime', lang)}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-amber-600">{avgResolutionHours}h</div>
          <div className="mt-1 text-xs text-slate-500">{t('avgResolution', lang)}</div>
        </Card>
      </div>
    </div>
  );
}
