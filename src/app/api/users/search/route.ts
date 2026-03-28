import { NextResponse } from "next/server";
import { searchUsers } from "@/lib/firestore";
import { getServerAuth } from "@/lib/server-auth";

export async function GET(req: Request) {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) return NextResponse.json([]);

  const users = await searchUsers(q);
  return NextResponse.json(users);
}
