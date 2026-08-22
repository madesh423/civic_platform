import { formatDistanceToNow, format } from 'date-fns';
import type { ReportStatus, SeverityLevel } from './types';

export function timeAgo(iso: string, lang: 'en' | 'ta' = 'en'): string {
  try {
    const d = new Date(iso);
    if (lang === 'ta') {
      const diff = Date.now() - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'இப்போது';
      if (mins < 60) return `${mins} நிமிடம் முன்பு`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs} மணி நேரம் முன்பு`;
      const days = Math.floor(hrs / 24);
      return `${days} நாள் முன்பு`;
    }
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return iso;
  }
}

export function formatDate(iso: string): string {
  try {
    return format(new Date(iso), 'dd MMM yyyy, hh:mm a');
  } catch {
    return iso;
  }
}

export function isOverdue(sla: string | null, status: ReportStatus): boolean {
  if (!sla) return false;
  if (['RESOLVED', 'REJECTED', 'DUPLICATE'].includes(status)) return false;
  return new Date(sla).getTime() < Date.now();
}

export function severityRank(s: SeverityLevel): number {
  return { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 }[s] ?? 0;
}

export function classNames(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(' ');
}

export function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n) + '…';
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
