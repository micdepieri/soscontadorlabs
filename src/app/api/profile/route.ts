import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { updateUserProfile } from "@/lib/firestore";

export async function PATCH(req: NextRequest) {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, avatarUrl, bio, city, state, skills, linkedin, instagram, phone } = body;

  await updateUserProfile(userId, {
    name: name ?? null,
    avatarUrl: avatarUrl ?? null,
    bio: bio ?? null,
    city: city ?? null,
    state: state ?? null,
    skills: Array.isArray(skills) ? skills : [],
    linkedin: linkedin ?? null,
    instagram: instagram ?? null,
    phone: phone ?? null,
  });

  return NextResponse.json({ success: true });
}
