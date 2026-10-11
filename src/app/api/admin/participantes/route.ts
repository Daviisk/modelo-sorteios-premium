import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listParticipants } from "@/lib/services/participantService";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const search = new URL(req.url).searchParams.get("search") ?? undefined;
  const participants = await listParticipants(search);
  return NextResponse.json({ participants });
}

