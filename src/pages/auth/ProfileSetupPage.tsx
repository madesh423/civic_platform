import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import { WARDS, LANGUAGES } from '@/lib/constants';
import { t } from '@/lib/i18n';
import type { LanguagePref } from '@/lib/types';

export function ProfileSetupPage() {
  const { profile, updateProfile, lang, setLang } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.name || '');
  const [ward, setWard] = useState(profile?.ward || WARDS[0]);
  const [language, setLanguage] = useState<LanguagePref>(lang);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLang(language);
    await updateProfile({ name, ward, language });
    setLoading(false);
    navigate('/app/home');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-1 text-xl font-bold text-slate-800">Complete your profile</h1>
        <p className="mb-6 text-sm text-slate-500">
          {lang === 'TA' ? 'உங்கள் விவரங்களை முடிக்கவும்' : 'Finish setting up your account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              {t('language', lang)}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLanguage(l.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    language === l.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-300 text-slate-600'
                  }`}
                >
                  {lang === 'TA' ? l.labelTa : l.label}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {t('submit', lang)}
          </Button>
        </form>
      </div>
    </div>
  );
}
