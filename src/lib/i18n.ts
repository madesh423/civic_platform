import type { LanguagePref } from './types';

type Dict = Record<string, { en: string; ta: string }>;

const STRINGS: Dict = {
  appName: { en: 'OorFix', ta: 'ஊர்ஃபிக்ஸ்' },
  tagline: {
    en: 'Report. Track. Resolve.',
    ta: 'புகார் செய். கண்காணி. தீர்வு.',
  },
  // navigation
  home: { en: 'Home', ta: 'முகப்பு' },
  reportIssue: { en: 'Report Issue', ta: 'புகார் செய்' },
  myReports: { en: 'My Reports', ta: 'எனது புகார்கள்' },
  nearby: { en: 'Nearby Issues', ta: 'அருகில் உள்ளவை' },
  myTasks: { en: 'My Tasks', ta: 'எனது பணிகள்' },
  overview: { en: 'Overview', ta: 'கண்ணோட்டம்' },
  reports: { en: 'Reports', ta: 'புகார்கள்' },
  workers: { en: 'Workers', ta: 'பணியாளர்கள்' },
  departments: { en: 'Departments', ta: 'துறைகள்' },
  analytics: { en: 'Analytics', ta: 'பகுப்பாய்வு' },
  settings: { en: 'Settings', ta: 'அமைப்புகள்' },
  logout: { en: 'Logout', ta: 'வெளியேறு' },
  // auth
  login: { en: 'Login', ta: 'உள்நுழை' },
  signup: { en: 'Sign Up', ta: 'பதிவு செய்' },
  email: { en: 'Email', ta: 'மின்னஞ்சல்' },
  password: { en: 'Password', ta: 'கடவுச்சொல்' },
  name: { en: 'Name', ta: 'பெயர்' },
  role: { en: 'Role', ta: 'பங்கு' },
  language: { en: 'Language', ta: 'மொழி' },
  ward: { en: 'Ward / Village', ta: 'வார்டு / கிராமம்' },
  inviteCode: { en: 'Invite Code', ta: 'அழைப்பு குறியீடு' },
  // actions
  submit: { en: 'Submit', ta: 'சமர்ப்பி' },
  cancel: { en: 'Cancel', ta: 'ரத்து' },
  upvote: { en: 'Upvote', ta: 'ஆதரவு' },
  confirmIssue: { en: 'I confirm this issue', ta: 'இந்த பிரச்சனை உண்மை' },
  accept: { en: 'Accept', ta: 'ஏற்' },
  start: { en: 'Start', ta: 'தொடங்கு' },
  complete: { en: 'Complete', ta: 'முடி' },
  resolve: { en: 'Resolve', ta: 'தீர்' },
  reassign: { en: 'Reassign', ta: 'மறுபரிசீலனை' },
  // report
  selectCategory: { en: 'Select Category', ta: 'பிரிவைத் தேர்வு செய்' },
  addPhotos: { en: 'Add Photos', ta: 'படங்களைச் சேர்' },
  title: { en: 'Title', ta: 'தலைப்பு' },
  description: { en: 'Description', ta: 'விளக்கம்' },
  location: { en: 'Location', ta: 'இடம்' },
  severity: { en: 'Severity', ta: 'தீவிரம்' },
  urgent: { en: 'Mark as Urgent', ta: 'அவசரம்' },
  statusTimeline: { en: 'Status Timeline', ta: 'நிலை காலக்கெடு' },
  beforePhotos: { en: 'Before Photos', ta: 'பணிக்கு முன்' },
  afterPhotos: { en: 'After Photos', ta: 'பணிக்கு பின்' },
  noReports: { en: 'No reports yet', ta: 'புகார்கள் இல்லை' },
  noTasks: { en: 'No tasks assigned', ta: 'பணிகள் ஒதுக்கப்படவில்லை' },
  // misc
  loading: { en: 'Loading...', ta: 'ஏற்றுகிறது...' },
  saving: { en: 'Saving...', ta: 'சேமிக்கிறது...' },
  search: { en: 'Search', ta: 'தேடு' },
  filter: { en: 'Filter', ta: 'வடிகட்டி' },
  all: { en: 'All', ta: 'அனைத்தும்' },
  openInMaps: { en: 'Open in Maps', ta: 'வரைபடத்தில் திற' },
  notifications: { en: 'Notifications', ta: 'அறிவிப்புகள்' },
  reputation: { en: 'Reputation', ta: 'நற்பெயர்' },
  assignedTo: { en: 'Assigned to', ta: 'ஒதுக்கப்பட்டது' },
  department: { en: 'Department', ta: 'துறை' },
  totalReports: { en: 'Total Reports', ta: 'மொத்த புகார்கள்' },
  open: { en: 'Open', ta: 'திறந்த' },
  overdue: { en: 'Overdue', ta: 'காலதாமதம்' },
  resolvedToday: { en: 'Resolved Today', ta: 'இன்று தீர்க்கப்பட்டது' },
  resolvedThisWeek: { en: 'Resolved This Week', ta: 'இந்த வாரம் தீர்க்கப்பட்டது' },
  needsAttention: { en: 'Needs Attention', ta: 'கவனம் தேவை' },
  performance: { en: 'Performance', ta: 'செயல்திறன்' },
  assignWorker: { en: 'Assign Worker', ta: 'பணியாளர் ஒதுக்கு' },
  autoAssign: { en: 'Auto-Assign', ta: 'தானியங்கி ஒதுக்கீடு' },
  rate: { en: 'Rate Resolution', ta: 'தீர்வை மதிப்பிடு' },
  comment: { en: 'Comment', ta: 'கருத்து' },
  activeWorkers: { en: 'Active Workers', ta: 'செயலில் உள்ள பணியாளர்கள்' },
  completed: { en: 'Completed', ta: 'முடிந்தது' },
  onTime: { en: 'On Time', ta: 'சரியான நேரம்' },
  avgResolution: { en: 'Avg Resolution', ta: 'சராசரி தீர்வு' },
  exportCsv: { en: 'Export CSV', ta: 'CSV ஏற்றுமதி' },
};

export function t(key: keyof typeof STRINGS, lang: LanguagePref): string {
  const entry = STRINGS[key];
  if (!entry) return String(key);
  return lang === 'TA' ? entry.ta : entry.en;
}

export type TranslationKey = keyof typeof STRINGS;
