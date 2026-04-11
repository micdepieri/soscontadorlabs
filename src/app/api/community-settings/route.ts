import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getCommunitySettings } from "@/lib/firestore";

export async function GET() {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await getCommunitySettings();
  return NextResponse.json({
    communityName: settings.communityName,
    communityTagline: settings.communityTagline,
  });
}
