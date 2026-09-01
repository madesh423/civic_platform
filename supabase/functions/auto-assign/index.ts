import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AssignRequest {
  report_id: string;
  auto?: boolean;
}

const SKILL_BY_CATEGORY: Record<string, string> = {
  street_light: "ELECTRICIAN",
  road: "ROAD",
  drainage: "SANITATION",
  garbage: "SANITATION",
  water_supply: "WATER",
  encroachment: "GENERAL",
  public_safety: "ELECTRICIAN",
  other: "GENERAL",
};

function haversineKm(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  try {
    const body = (await req.json()) as AssignRequest;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: report } = await supabase
      .from("reports")
      .select("id, category_id, latitude, longitude, severity, assigned_department_id, status")
      .eq("id", body.report_id)
      .maybeSingle();

    if (!report) {
      return new Response(JSON.stringify({ error: "Report not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: category } = await supabase
      .from("categories")
      .select("slug, default_department_id")
      .eq("id", report.category_id)
      .maybeSingle();

    const categorySlug = category?.slug ?? "other";
    const requiredSkill = SKILL_BY_CATEGORY[categorySlug] ?? "GENERAL";

    const { data: workers } = await supabase
      .from("worker_profiles")
      .select("user_id, skills, base_lat, base_lng, max_tasks_per_day, is_active")
      .eq("is_active", true);

    const active = (workers ?? []).filter((w) =>
      Array.isArray(w.skills) && w.skills.includes(requiredSkill)
    );

    if (active.length === 0) {
      return new Response(
        JSON.stringify({ assigned: false, reason: "No workers with matching skill" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { count } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .in("assigned_worker_id", active.map((w) => w.user_id))
      .in("status", ["ASSIGNED", "IN_PROGRESS"]);

    const openCounts: Record<string, number> = {};
    if (count && count > 0) {
      const { data: grouped } = await supabase
        .from("reports")
        .select("assigned_worker_id")
        .in("assigned_worker_id", active.map((w) => w.user_id))
        .in("status", ["ASSIGNED", "IN_PROGRESS"]);
      (grouped ?? []).forEach((g) => {
        const wid = g.assigned_worker_id as string;
        openCounts[wid] = (openCounts[wid] ?? 0) + 1;
      });
    }

    const severityWeight = report.severity === "CRITICAL" ? 1.4 : 1.0;

    let bestWorker = null as null | (typeof active)[number];
    let bestScore = -Infinity;
    for (const w of active) {
      const open = openCounts[w.user_id] ?? 0;
      if (open >= w.max_tasks_per_day) continue;
      const distKm = haversineKm(report.latitude, report.longitude, w.base_lat, w.base_lng);
      const loadScore = 1 - open / Math.max(w.max_tasks_per_day, 1);
      const proxScore = 1 / (1 + distKm);
      const score = (loadScore * 0.4 + proxScore * 0.6) * severityWeight;
      if (score > bestScore) {
        bestScore = score;
        bestWorker = w;
      }
    }

    if (!bestWorker) {
      return new Response(
        JSON.stringify({ assigned: false, reason: "All matching workers at capacity" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const deptId = category?.default_department_id ?? report.assigned_department_id ?? null;

    const { data: assignment } = await supabase
      .from("assignments")
      .insert({
        report_id: report.id,
        worker_id: bestWorker.user_id,
        department_id: deptId,
        assigned_by: bestWorker.user_id,
        assigned_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();

    const slaHours = report.severity === "CRITICAL" ? 12 : 48;
    const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

    await supabase
      .from("reports")
      .update({
        assigned_worker_id: bestWorker.user_id,
        assigned_department_id: deptId,
        status: "ASSIGNED",
        sla_deadline_at: slaDeadline,
        updated_at: new Date().toISOString(),
      })
      .eq("id", report.id);

    await supabase.from("report_updates").insert({
      report_id: report.id,
      updated_by: bestWorker.user_id,
      old_status: report.status,
      new_status: "ASSIGNED",
      comment: "Auto-assigned to worker based on skill, proximity, and current load.",
    });

    return new Response(
      JSON.stringify({
        assigned: true,
        assignment_id: assignment?.id ?? null,
        worker_id: bestWorker.user_id,
        department_id: deptId,
        score: bestScore,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
