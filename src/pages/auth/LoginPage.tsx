import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button, Spinner } from '@/components/ui';
import { LANGUAGES } from '@/lib/constants';
import { t } from '@/lib/i18n';
import type { LanguagePref } from '@/lib/types';

export function LoginPage() {
  const { lang, setLang } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
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

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white">
              O
            </div>
            <h1 className="text-2xl font-bold text-slate-800">OorFix</h1>
            <p className="text-sm text-slate-500">{t('tagline', lang)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {t('email', lang)}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {t('password', lang)}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {t('login', lang)}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            <Link to="/signup" className="font-medium text-emerald-600 hover:underline">
              {t('signup', lang)}
            </Link>
          </p>

          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <div className="font-semibold text-slate-600">Demo accounts (email / password):</div>
            <div className="mt-1 space-y-0.5">
              <div>citizen@oorfix.app / demo1234</div>
              <div>worker@oorfix.app / demo1234</div>
              <div>admin@oorfix.app / demo1234</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
