import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, getContentRequests } from "@/lib/firestore";

async function requireAdmin() {
  const { userId } = await getServerAuth();
  if (!userId) return null;
  const user = await getUserByUid(userId);
  return user?.role === "ADMIN" ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const requests = await getContentRequests();
  return NextResponse.json(requests);
}
