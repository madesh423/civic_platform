import { useEffect, useState } from 'react';
import { User, Mail, MapPin, Star, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, Spinner, Button } from '@/components/ui';
import { SKILL_META } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { classNames } from '@/lib/utils';
import type { Profile, WorkerProfile, WorkerSkill } from '@/lib/types';

interface WorkerRow extends WorkerProfile {
  name: string;
  email: string;
  ward: string;
  openTasks: number;
}

export function AdminWorkers() {
  const { lang } = useAuth();
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: wp } = await supabase.from('worker_profiles').select('*');
      const profiles = (wp ?? []) as WorkerProfile[];
      if (profiles.length === 0) {
        setLoading(false);
        return;
      }
      const ids = profiles.map((w) => w.user_id);
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, name, ward')
        .in('id', ids);
      const profMap = new Map((profs as Profile[])?.map((p) => [p.id, p]) ?? []);

      const { data: counts } = await supabase
        .from('reports')
        .select('assigned_worker_id')
        .in('assigned_worker_id', ids)
        .in('status', ['ASSIGNED', 'IN_PROGRESS']);

      const openMap: Record<string, number> = {};
      (counts ?? []).forEach((c) => {
        const wid = c.assigned_worker_id as string;
        openMap[wid] = (openMap[wid] ?? 0) + 1;
      });

      setWorkers(
        profiles.map((w) => ({
          ...w,
          name: profMap.get(w.user_id)?.name ?? 'Unknown',
          email: '',
          ward: profMap.get(w.user_id)?.ward ?? '',
          openTasks: openMap[w.user_id] ?? 0,
        }))
      );
      setLoading(false);
    })();
  }, []);

  const toggleActive = async (userId: string, current: boolean) => {
    await supabase.from('worker_profiles').update({ is_active: !current }).eq('user_id', userId);
    setWorkers((prev) =>
      prev.map((w) => (w.user_id === userId ? { ...w, is_active: !current } : w))
    );
  };

  if (loading) return <Spinner className="py-20" />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t('workers', lang)}</h1>
        <p className="text-sm text-slate-500">{workers.length} {lang === 'TA' ? 'பணியாளர்கள்' : 'workers'}</p>
      </div>

      {workers.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-400">
          {lang === 'TA' ? 'பணியாளர்கள் இல்லை' : 'No workers registered'}
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {workers.map((w) => (
            <Card key={w.user_id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {w.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{w.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin size={10} />
                      {w.ward || '—'}
                    </div>
                  </div>
                </div>
                <span
                  className={classNames(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    w.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {w.is_active ? (lang === 'TA' ? 'செயலில்' : 'Active') : (lang === 'TA' ? 'முடங்கப்பட்டது' : 'Inactive')}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {w.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                  >
                    {lang === 'TA' ? SKILL_META[s as WorkerSkill]?.labelTa : SKILL_META[s as WorkerSkill]?.label}
                  </span>
                ))}
                {w.skills.length === 0 && (
                  <span className="text-xs text-slate-400">No skills assigned</span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-lg font-bold text-amber-600">
                    <Activity size={14} />
                    {w.openTasks}
                  </div>
                  <div className="text-[10px] text-slate-400">{t('open', lang)}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-700">{w.max_tasks_per_day}</div>
                  <div className="text-[10px] text-slate-400">{lang === 'TA' ? 'அதிகபட்ச பணிகள்' : 'Max/day'}</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-lg font-bold text-slate-700">
                    <Star size={14} className="text-amber-400" />
                    —
                  </div>
                  <div className="text-[10px] text-slate-400">{t('rate', lang)}</div>
                </div>
              </div>

              <div className="mt-3">
                <Button
                  size="sm"
                  variant={w.is_active ? 'outline' : 'primary'}
                  onClick={() => toggleActive(w.user_id, w.is_active)}
                  className="w-full"
                >
                  {w.is_active ? (lang === 'TA' ? 'முடக்கு' : 'Deactivate') : (lang === 'TA' ? 'செயல்படுத்து' : 'Activate')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
