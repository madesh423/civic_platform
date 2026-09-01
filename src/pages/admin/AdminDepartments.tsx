import { useEffect, useState } from 'react';
import { Phone, Building2, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, Spinner, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import type { Department } from '@/lib/types';

export function AdminDepartments() {
  const { lang } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const load = async () => {
    const { data } = await supabase.from('departments').select('*').order('name');
    setDepartments((data as Department[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await supabase.from('departments').insert({
      name: newName.trim(),
      contact_phone: newPhone.trim() || '',
    });
    setNewName('');
    setNewPhone('');
    setShowAdd(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('departments').delete().eq('id', id);
    load();
  };

  if (loading) return <Spinner className="py-20" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('departments', lang)}</h1>
          <p className="text-sm text-slate-500">{departments.length} departments</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={14} />
          {lang === 'TA' ? 'சேர்' : 'Add'}
        </Button>
      </div>

      {showAdd && (
        <Card className="flex flex-wrap gap-2 p-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Department name"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          <input
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="Contact phone"
            className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>
            {t('submit', lang)}
          </Button>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {departments.map((d) => {
          const slaKeys = Object.keys(d.sla_hours_by_category || {});
          return (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{d.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Phone size={10} />
                      {d.contact_phone || '—'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {slaKeys.length > 0 && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <div className="mb-1 text-xs font-medium text-slate-500">SLA Hours</div>
                  <div className="flex flex-wrap gap-2">
                    {slaKeys.map((k) => (
                      <span key={k} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {k}: {d.sla_hours_by_category[k]}h
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
