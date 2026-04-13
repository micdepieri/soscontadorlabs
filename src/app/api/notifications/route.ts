import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getUserNotifications, markNotificationsRead } from "@/lib/firestore";

export async function GET() {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await getUserNotifications(userId);
  return NextResponse.json(notifications);
}

export async function PATCH() {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await markNotificationsRead(userId);
  return NextResponse.json({ ok: true });
}
