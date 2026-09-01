import type {
  LanguagePref,
  ReportStatus,
  SeverityLevel,
  UserRole,
  WorkerSkill,
} from './types';

export const STATUS_META: Record<
  ReportStatus,
  { label: string; labelTa: string; color: string; bg: string; text: string }
> = {
  SUBMITTED: {
    label: 'Submitted',
    labelTa: 'சமர்ப்பிக்கப்பட்டது',
    color: '#64748b',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
  },
  VERIFIED: {
    label: 'Verified',
    labelTa: 'சரிபார்க்கப்பட்டது',
    color: '#0891b2',
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
  },
  ASSIGNED: {
    label: 'Assigned',
    labelTa: 'ஒதுக்கப்பட்டது',
    color: '#2563eb',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    labelTa: 'நடந்து கொண்டிருக்கிறது',
    color: '#f59e0b',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
  },
  RESOLVED: {
    label: 'Resolved',
    labelTa: 'தீர்க்கப்பட்டது',
    color: '#16a34a',
    bg: 'bg-green-100',
    text: 'text-green-700',
  },
  REJECTED: {
    label: 'Rejected',
    labelTa: 'நிராகரிக்கப்பட்டது',
    color: '#dc2626',
    bg: 'bg-red-100',
    text: 'text-red-700',
  },
  DUPLICATE: {
    label: 'Duplicate',
    labelTa: 'நகல்',
    color: '#7c3aed',
    bg: 'bg-violet-100',
    text: 'text-violet-700',
  },
};

export const SEVERITY_META: Record<
  SeverityLevel,
  { label: string; labelTa: string; color: string; bg: string; text: string }
> = {
  LOW: {
    label: 'Low',
    labelTa: 'குறைவு',
    color: '#16a34a',
    bg: 'bg-green-100',
    text: 'text-green-700',
  },
  MEDIUM: {
    label: 'Medium',
    labelTa: 'நடுத்தரம்',
    color: '#f59e0b',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
  },
  HIGH: {
    label: 'High',
    labelTa: 'அதிகம்',
    color: '#ea580c',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
  },
  CRITICAL: {
    label: 'Critical',
    labelTa: 'மிக முக்கியம்',
    color: '#dc2626',
    bg: 'bg-red-100',
    text: 'text-red-700',
  },
};

export const ROLE_META: Record<UserRole, { label: string; labelTa: string }> = {
  CITIZEN: { label: 'Citizen', labelTa: 'குடிமகன்' },
  WORKER: { label: 'Worker', labelTa: 'பணியாளர்' },
  ADMIN: { label: 'Admin', labelTa: 'நிர்வாகம்' },
};

export const SKILL_META: Record<WorkerSkill, { label: string; labelTa: string }> = {
  ELECTRICIAN: { label: 'Electrician', labelTa: 'மின்சாரம்' },
  PLUMBER: { label: 'Plumber', labelTa: 'குழாய்' },
  SANITATION: { label: 'Sanitation', labelTa: 'ுப்புரவு' },
  ROAD: { label: 'Road', labelTa: 'சாலை' },
  WATER: { label: 'Water', labelTa: 'தண்ணீர்' },
  GENERAL: { label: 'General', labelTa: 'பொது' },
};

export const ROLE_INVITE_CODES: Record<UserRole, string> = {
  CITIZEN: '',
  WORKER: 'WORKER-2026',
  ADMIN: 'ADMIN-2026',
};

export const CHENNAI_CENTER: [number, number] = [13.0827, 80.2707];

export const WARDS = [
  'Ward 1 - Tondiarpet',
  'Ward 2 - Royapuram',
  'Ward 3 - Thiruvottiyur',
  'Ward 4 - Manali',
  'Ward 5 - Madhavaram',
  'Ward 6 - Teynampet',
  'Ward 7 - Kodambakkam',
  'Ward 8 - Valasaravakkam',
  'Ward 9 - Adyar',
  'Ward 10 - Sholinganallur',
];

export const LANGUAGES: { value: LanguagePref; label: string; labelTa: string }[] = [
  { value: 'EN', label: 'English', labelTa: 'ஆங்கிலம்' },
  { value: 'TA', label: 'Tamil', labelTa: 'தமிழ்' },
];
