import { useAuth } from '@/context/AuthContext';
import { Card, Button } from '@/components/ui';
import { WARDS, LANGUAGES } from '@/lib/constants';
import { t } from '@/lib/i18n';
import type { LanguagePref } from '@/lib/types';

export function AdminSettings() {
  const { profile, updateProfile, lang, setLang } = useAuth();

  const handleLangChange = (l: LanguagePref) => {
    setLang(l);
    if (profile) updateProfile({ language: l });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{t('settings', lang)}</h1>
        <p className="text-sm text-slate-500">
          {lang === 'TA' ? 'கணக்கு அமைப்புகள்' : 'Account settings'}
        </p>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">{t('name', lang)}</h3>
        <div className="text-sm text-slate-600">{profile?.name}</div>
        <div className="mt-1 text-xs text-slate-400">{profile?.civic_id}</div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">{t('ward', lang)}</h3>
        <div className="text-sm text-slate-600">{profile?.ward}</div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">{t('language', lang)}</h3>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              onClick={() => handleLangChange(l.value)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                lang === l.value
                  ? 'border-slate-700 bg-slate-800 text-white'
                  : 'border-slate-300 text-slate-600'
              }`}
            >
              {lang === 'TA' ? l.labelTa : l.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-1 text-sm font-semibold text-slate-700">{t('reputation', lang)}</h3>
        <div className="text-2xl font-bold text-slate-800">{profile?.reputation_score ?? 0}</div>
        <p className="text-xs text-slate-400">
          {lang === 'TA' ? 'புகார்கள் மற்றும் தீர்வுகளால் பெறப்பட்டது' : 'Earned through reports and resolutions'}
        </p>
      </Card>
    </div>
  );
}
