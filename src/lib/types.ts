export type UserRole = 'CITIZEN' | 'WORKER' | 'ADMIN';
export type LanguagePref = 'EN' | 'TA' | 'HI';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReportStatus =
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'
  | 'DUPLICATE';
export type MediaType = 'IMAGE' | 'VIDEO';
export type BeforeAfter = 'BEFORE' | 'AFTER';
export type WorkerSkill =
  | 'ELECTRICIAN'
  | 'PLUMBER'
  | 'SANITATION'
  | 'ROAD'
  | 'WATER'
  | 'GENERAL';

export interface Profile {
  id: string;
  civic_id: string;
  name: string;
  phone: string | null;
  role: UserRole;
  language: LanguagePref;
  ward: string;
  reputation_score: number;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  contact_phone: string;
  sla_hours_by_category: Record<string, number>;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  default_department_id: string | null;
  icon_name: string;
  color_hex: string;
}

export interface WorkerProfile {
  user_id: string;
  skills: WorkerSkill[];
  base_lat: number;
  base_lng: number;
  working_hours: Record<string, unknown>;
  max_tasks_per_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  category_id: string | null;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address_text: string;
  severity: SeverityLevel;
  status: ReportStatus;
  ai_category_suggestion: string | null;
  ai_confidence: number;
  ai_severity: SeverityLevel | null;
  assigned_department_id: string | null;
  assigned_worker_id: string | null;
  sla_deadline_at: string | null;
  resolved_at: string | null;
  upvotes_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReportMedia {
  id: string;
  report_id: string;
  media_type: MediaType;
  storage_url: string;
  before_after: BeforeAfter;
  uploaded_by: string;
  created_at: string;
}

export interface ReportUpdate {
  id: string;
  report_id: string;
  updated_by: string;
  old_status: ReportStatus | null;
  new_status: ReportStatus | null;
  comment: string;
  media_id: string | null;
  created_at: string;
}

export interface Upvote {
  id: string;
  report_id: string;
  user_id: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  report_id: string;
  worker_id: string;
  department_id: string | null;
  assigned_by: string;
  assigned_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  rating_by_admin: number | null;
  rating_by_citizen: number | null;
  comment: string;
}

export interface ReportWithRelations extends Report {
  category?: Category | null;
  reporter?: Pick<Profile, 'id' | 'name' | 'ward'> | null;
  assigned_worker?: Pick<Profile, 'id' | 'name'> | null;
  assigned_department?: Pick<Department, 'id' | 'name'> | null;
  media?: ReportMedia[];
  updates?: (ReportUpdate & {
    updater?: Pick<Profile, 'id' | 'name'> | null;
  })[];
  upvoted_by_me?: boolean;
}

export interface AssignmentWithRelations extends Assignment {
  report?: ReportWithRelations | null;
  worker?: Pick<Profile, 'id' | 'name' | 'ward'> | null;
}
