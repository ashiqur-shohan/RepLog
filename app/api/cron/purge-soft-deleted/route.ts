import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("purge_soft_deleted");
    if (error) throw error;
    log.info("purge_soft_deleted complete", { rowsPurged: data });
    return NextResponse.json({ ok: true, purged: data });
  } catch (err) {
    log.error("purge_soft_deleted failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "purge failed" }, { status: 500 });
  }
}
