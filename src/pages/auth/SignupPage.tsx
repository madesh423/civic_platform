import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import { LANGUAGES, ROLE_INVITE_CODES, WARDS } from '@/lib/constants';
import { t } from '@/lib/i18n';
import type { LanguagePref, UserRole } from '@/lib/types';

const ROLES: { value: UserRole; label: string; labelTa: string }[] = [
  { value: 'CITIZEN', label: 'Citizen', labelTa: 'குடிமகன்' },
  { value: 'WORKER', label: 'Worker', labelTa: 'பணியாளர்' },
  { value: 'ADMIN', label: 'Admin', labelTa: 'நிர்வாகம்' },
];

export function SignupPage() {
  const { lang, setLang } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('CITIZEN');
  const [ward, setWard] = useState(WARDS[0]);
  const [invite, setInvite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role !== 'CITIZEN' && invite !== ROLE_INVITE_CODES[role]) {
      setError(
        lang === 'TA'
          ? 'தவறான அழைப்பு குறியீடு. பணியாளர்/நிர்வாக பங்குக்கு அழைப்பு குறியீடு தேவை.'
          : 'Invalid invite code. Worker/Admin roles require an invite code.'
      );
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone: '', role, language: lang, ward },
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    // Set role on the profile (the handle_new_user trigger created a CITIZEN row by default)
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ name, role, ward, language: lang })
        .eq('id', data.user.id);
    }
    navigate('/app/home');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-700 to-emerald-900">
      <div className="flex justify-end p-4">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as LanguagePref)}
          className="rounded-lg bg-white/10 px-2 py-1 text-sm text-white outline-none"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value} className="text-slate-800">
              {lang === 'TA' ? l.labelTa : l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white">
              O
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{t('signup', lang)}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {t('name', lang)}
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {t('email', lang)}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {t('password', lang)}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {t('role', lang)}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium ${
                      role === r.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    {lang === 'TA' ? r.labelTa : r.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {t('ward', lang)}
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                {WARDS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            {role !== 'CITIZEN' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {t('inviteCode', lang)}
                </label>
                <input
                  value={invite}
                  onChange={(e) => setInvite(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  placeholder={ROLE_INVITE_CODES[role]}
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  {lang === 'TA'
                    ? 'இந்த டெமோவுக்கு குறியீடு காட்டப்பட்டுள்ளது'
                    : 'Demo code shown as placeholder'}
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {t('signup', lang)}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            <Link to="/login" className="font-medium text-emerald-600 hover:underline">
              {t('login', lang)}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
