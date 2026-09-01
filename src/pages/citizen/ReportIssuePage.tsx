import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/lib/hooks';
import { Button, Card, CategoryIcon, Spinner } from '@/components/ui';
import { OorfixMap } from '@/components/OorfixMap';
import { CHENNAI_CENTER } from '@/lib/constants';
import { compressImage, uploadReportImage } from '@/lib/media';
import { supabase, EDGE_AI_CATEGORIZE } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { classNames } from '@/lib/utils';
import type { SeverityLevel } from '@/lib/types';

const SEVERITIES: SeverityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function ReportIssuePage() {
  const { profile, session, lang } = useAuth();
  const navigate = useNavigate();
  const { categories, loading: catsLoading } = useCategories();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('MEDIUM');
  const [lat, setLat] = useState(CHENNAI_CENTER[0]);
  const [lng, setLng] = useState(CHENNAI_CENTER[1]);
  const [address, setAddress] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    for (const file of Array.from(fileList).slice(0, 5 - files.length)) {
      try {
        const compressed = await compressImage(file);
        newFiles.push(compressed);
        newPreviews.push(URL.createObjectURL(compressed));
      } catch {
        newFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }
    }
    setFiles([...files, ...newFiles]);
    setPreviews([...previews, ...newPreviews]);
  };

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setFiles(files.filter((_, i) => i !== idx));
    setPreviews(previews.filter((_, i) => i !== idx));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !description.trim()) {
      setError(lang === 'TA' ? 'தலைப்பு மற்றும் விளக்கம் தேவை' : 'Title and description are required');
      return;
    }
    if (!confirm) {
      setError(lang === 'TA' ? 'பிரச்சனை உண்மை என உறுதிப்படுத்தவும்' : 'Please confirm this issue is real');
      return;
    }
    if (!session?.user) return;
    setSubmitting(true);

    try {
      const { data: report, error: insertError } = await supabase
        .from('reports')
        .insert({
          reporter_id: session.user.id,
          category_id: categoryId || null,
          title: title.trim(),
          description: description.trim(),
          latitude: lat,
          longitude: lng,
          address_text: address.trim(),
          severity,
          status: 'SUBMITTED',
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      const reportId = report.id;

      for (const file of files) {
        try {
          const url = await uploadReportImage(file, reportId, session.user.id);
          await supabase.from('report_media').insert({
            report_id: reportId,
            media_type: 'IMAGE',
            storage_url: url,
            before_after: 'BEFORE',
            uploaded_by: session.user.id,
          });
        } catch (err) {
          console.error('Image upload failed', err);
        }
      }

      try {
        await fetch(EDGE_AI_CATEGORIZE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ report_id: reportId, title, description }),
        });
      } catch {
        // AI categorization is best-effort
      }

      navigate(`/app/report/${reportId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (catsLoading) return <Spinner className="py-20" />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">{t('reportIssue', lang)}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-4">
          <label className="mb-2 block text-xs font-medium text-slate-600">
            {t('selectCategory', lang)}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={classNames(
                  'flex flex-col items-center gap-1 rounded-lg border p-2 transition-all',
                  categoryId === cat.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <CategoryIcon category={cat} size={20} />
                <span className="text-[10px] font-medium text-slate-600">{cat.name}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-3 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">{t('title', lang)}</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder={lang === 'TA' ? 'பிரச்சனையின் தலைப்பு' : 'Brief title of the issue'}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">{t('description', lang)}</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder={lang === 'TA' ? 'விரிவான விளக்கம்' : 'Describe the issue in detail'}
            />
          </div>
        </Card>

        <Card className="p-4">
          <label className="mb-2 block text-xs font-medium text-slate-600">{t('severity', lang)}</label>
          <div className="grid grid-cols-4 gap-2">
            {SEVERITIES.map((s) => {
              const colors: Record<SeverityLevel, string> = {
                LOW: 'border-green-500 bg-green-50 text-green-700',
                MEDIUM: 'border-amber-500 bg-amber-50 text-amber-700',
                HIGH: 'border-orange-500 bg-orange-50 text-orange-700',
                CRITICAL: 'border-red-500 bg-red-50 text-red-700',
              };
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={classNames(
                    'rounded-lg border px-2 py-2 text-xs font-semibold transition-all',
                    severity === s ? colors[s] : 'border-slate-200 text-slate-500'
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-slate-600">{t('location', lang)}</label>
            <button
              type="button"
              onClick={useMyLocation}
              className="flex items-center gap-1 text-xs font-medium text-emerald-600"
            >
              <MapPin size={12} />
              {lang === 'TA' ? 'எனது இடம்' : 'My location'}
            </button>
          </div>
          <OorfixMap
            center={[lat, lng]}
            zoom={14}
            height="200px"
            marker={{ lat, lng }}
            onMarkerDrag={(la, ln) => {
              setLat(la);
              setLng(ln);
            }}
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            placeholder={lang === 'TA' ? 'முகவரி / பகுதி' : 'Address / area name'}
          />
        </Card>

        <Card className="p-4">
          <label className="mb-2 block text-xs font-medium text-slate-600">{t('addPhotos', lang)}</label>
          <div className="flex flex-wrap gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} alt="preview" className="h-20 w-20 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {files.length < 5 && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-emerald-400 hover:text-emerald-500">
                <Camera size={20} />
                <span className="mt-1 text-[9px]">Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
            )}
          </div>
        </Card>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          {t('confirmIssue', lang)}
        </label>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        <Button type="submit" loading={submitting} className="w-full" size="lg" disabled={!confirm}>
          {submitting ? t('saving', lang) : t('submit', lang)}
        </Button>
      </form>
    </div>
  );
}
