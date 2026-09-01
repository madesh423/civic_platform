import {
  AlertCircle,
  Ban,
  Construction,
  Droplets,
  Lightbulb,
  ShieldAlert,
  Trash2,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import type { Category, ReportStatus, SeverityLevel } from '@/lib/types';
import { SEVERITY_META, STATUS_META } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { t } from '@/lib/i18n';
import { classNames } from '@/lib/utils';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Lightbulb,
  Construction,
  Waves,
  Trash2,
  Droplets,
  Ban,
  ShieldAlert,
  AlertCircle,
};

export function CategoryIcon({ category, size = 20 }: { category: Category | null; size?: number }) {
  const Icon = (category && CATEGORY_ICONS[category.icon_name]) || AlertCircle;
  const color = category?.color_hex ?? '#64748b';
  return (
    <div
      className="flex items-center justify-center rounded-lg shrink-0"
      style={{ backgroundColor: `${color}1a`, color, width: size + 16, height: size + 16 }}
    >
      <Icon size={size} />
    </div>
  );
}

export function StatusChip({ status }: { status: ReportStatus }) {
  const meta = STATUS_META[status];
  const { lang } = useAuth();
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        meta.bg,
        meta.text
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {lang === 'TA' ? meta.labelTa : meta.label}
    </span>
  );
}

export function SeverityChip({ severity }: { severity: SeverityLevel }) {
  const meta = SEVERITY_META[severity];
  const { lang } = useAuth();
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        meta.bg,
        meta.text
      )}
    >
      {lang === 'TA' ? meta.labelTa : meta.label}
    </span>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    secondary: 'bg-slate-800 text-white hover:bg-slate-900',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classNames(base, sizes[size], variants[variant], className)}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={classNames('flex items-center justify-center', className)}>
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  const { lang } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 rounded-full bg-slate-100 p-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {lang === 'TA' && <span className="mt-1 text-xs text-slate-400">தமிழ்</span>}
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={classNames('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  color = '#10b981',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-800">{value}</div>
          <div className="text-xs font-medium text-slate-500">{label}</div>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}

export function useT() {
  const { lang } = useAuth();
  return (key: Parameters<typeof t>[0]) => t(key, lang);
}
