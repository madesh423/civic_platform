import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CategorizeRequest {
  report_id?: string;
  title?: string;
  description?: string;
  image_urls?: string[];
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
}

// Keyword-based categorization used as mock mode.
const KEYWORD_MAP: Record<string, string[]> = {
  street_light: ["light", "lamp", "streetlight", "bulb", "pole", "street light", "dark"],
  road: ["road", "pothole", "crack", "tar", "pavement", "speed breaker", "sidewalk"],
  drainage: ["drain", "drainage", "sewage", "manhole", "overflow", "clog"],
  garbage: ["garbage", "trash", "waste", "dump", "rubbish", "bin", "litter"],
  water_supply: ["water", "pipe", "leak", "tap", "tank", "supply", "sewage water"],
  encroachment: ["encroach", "illegal", "obstruction", "footpath", "vendor"],
  public_safety: ["safety", "danger", "fire", "accident", "wire", "electric", "fallen tree"],
};

const SEVERITY_RULES: Record<string, "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"> = {
  street_light: "MEDIUM",
  road: "MEDIUM",
  drainage: "HIGH",
  garbage: "LOW",
  water_supply: "HIGH",
  encroachment: "MEDIUM",
  public_safety: "CRITICAL",
  other: "LOW",
};

function suggestByKeywords(text: string): { slug: string; confidence: number } {
  const lower = (text || "").toLowerCase();
  const scores: Record<string, number> = {};
  for (const [slug, words] of Object.entries(KEYWORD_MAP)) {
    scores[slug] = 0;
    for (const w of words) {
      if (lower.includes(w)) scores[slug] += 1;
    }
  }
  let best = "other";
  let bestScore = 0;
  for (const [slug, s] of Object.entries(scores)) {
    if (s > bestScore) {
      best = slug;
      bestScore = s;
    }
  }
  const confidence = bestScore === 0 ? 0.35 : Math.min(0.5 + bestScore * 0.15, 0.95);
  return { slug: best, confidence };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  try {
    const body = (await req.json()) as CategorizeRequest;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: categories } = await supabase.from("categories").select("id,name,slug");
    const cats = (categories ?? []) as CategoryRow[];

    const combined = `${body.title || ""} ${body.description || ""}`.trim();
    const { slug, confidence } = suggestByKeywords(combined);
    const matched = cats.find((c) => c.slug === slug) ?? cats[cats.length - 1];
    const severity = SEVERITY_RULES[matched?.slug ?? "other"] ?? "MEDIUM";

    let reportId = body.report_id;
    let updatedReport = false;
    if (reportId) {
      const { error } = await supabase
        .from("reports")
        .update({
          ai_category_suggestion: matched?.id ?? null,
          ai_confidence: confidence,
          ai_severity: severity,
          category_id: matched?.id ?? null,
          severity: severity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);
      updatedReport = !error;
    }

    return new Response(
      JSON.stringify({
        suggested_category_id: matched?.id ?? null,
        suggested_category: matched?.slug ?? "other",
        suggested_category_name: matched?.name ?? "Other",
        confidence,
        suggested_severity: severity,
        updated_report: updatedReport,
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
