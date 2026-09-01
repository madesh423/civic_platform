import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type {
  AssignmentWithRelations,
  Category,
  Department,
  ReportWithRelations,
} from './types';

export function useCategories(): { categories: Category[]; loading: boolean } {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setCategories((data as Category[]) ?? []);
        setLoading(false);
      });
  }, []);
  return { categories, loading };
}

export function useDepartments(): { departments: Department[]; loading: boolean } {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      .from('departments')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setDepartments((data as Department[]) ?? []);
        setLoading(false);
      });
  }, []);
  return { departments, loading };
}

const REPORT_SELECT = `
  *,
  category:categories!reports_category_id_fkey(*),
  reporter:profiles!reports_reporter_id_fkey(id,name,ward),
  assigned_worker:profiles!reports_assigned_worker_id_fkey(id,name),
  assigned_department:departments!reports_assigned_department_id_fkey(id,name),
  media:report_media(*),
  updates:report_updates(
    *,
    updater:profiles!report_updates_updated_by_fkey(id,name)
  )
` as const;

export function useReport(id: string | undefined, userId?: string): {
  report: ReportWithRelations | null;
  loading: boolean;
  error: string;
  refetch: () => void;
} {
  const [report, setReport] = useState<ReportWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data, error: err } = await supabase
        .from('reports')
        .select(REPORT_SELECT)
        .eq('id', id)
        .maybeSingle();
      if (err) {
        setError(err.message);
        setReport(null);
        setLoading(false);
        return;
      }
      let upvotedByMe = false;
      if (userId && data) {
        const { data: uv } = await supabase
          .from('upvotes')
          .select('id')
          .eq('report_id', id)
          .eq('user_id', userId)
          .maybeSingle();
        upvotedByMe = !!uv;
      }
      setError('');
      setReport({ ...(data as ReportWithRelations), upvoted_by_me: upvotedByMe });
      setLoading(false);
    })();
  }, [id, tick, userId]);

  return { report, loading, error, refetch };
}

export function useReports(filters?: {
  reporterId?: string;
  assignedWorkerId?: string;
  status?: string;
  categoryId?: string;
  limit?: number;
}): { reports: ReportWithRelations[]; loading: boolean; refetch: () => void } {
  const [reports, setReports] = useState<ReportWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let q = supabase.from('reports').select(REPORT_SELECT);
    if (filters?.reporterId) q = q.eq('reporter_id', filters.reporterId);
    if (filters?.assignedWorkerId) q = q.eq('assigned_worker_id', filters.assignedWorkerId);
    if (filters?.status && filters.status !== 'ALL') q = q.eq('status', filters.status);
    if (filters?.categoryId && filters.categoryId !== 'ALL') q = q.eq('category_id', filters.categoryId);
    q = q.order('created_at', { ascending: false });
    if (filters?.limit) q = q.limit(filters.limit);
    q.then(({ data }) => {
      setReports((data as ReportWithRelations[]) ?? []);
      setLoading(false);
    });
  }, [tick, filters?.reporterId, filters?.assignedWorkerId, filters?.status, filters?.categoryId, filters?.limit]);

  return { reports, loading, refetch };
}

export function useMyAssignments(workerId: string | undefined): {
  assignments: AssignmentWithRelations[];
  loading: boolean;
  refetch: () => void;
} {
  const [assignments, setAssignments] = useState<AssignmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!workerId) {
      setLoading(false);
      return;
    }
    supabase
      .from('assignments')
      .select(
        `*,
        report:reports(
          *,
          category:categories!reports_category_id_fkey(*),
          reporter:profiles!reports_reporter_id_fkey(id,name,ward),
          assigned_department:departments!reports_assigned_department_id_fkey(id,name),
          media:report_media(*)
        ),
        worker:profiles!assignments_worker_id_fkey(id,name,ward)`
      )
      .eq('worker_id', workerId)
      .order('assigned_at', { ascending: false })
      .then(({ data }) => {
        setAssignments((data as AssignmentWithRelations[]) ?? []);
        setLoading(false);
      });
  }, [workerId, tick]);

  return { assignments, loading, refetch };
}

export async function toggleUpvote(reportId: string, userId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('upvotes')
    .select('id')
    .eq('report_id', reportId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) {
    await supabase.from('upvotes').delete().eq('id', existing.id);
  } else {
    await supabase.from('upvotes').insert({ report_id: reportId, user_id: userId });
  }
}
