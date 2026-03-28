import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { uid, email, displayName, photoURL } = body;

  if (!uid || !email) {
    return NextResponse.json({ error: "Missing uid or email" }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const isAdmin = email === "michael@mappisc.com.br";
      await userRef.set({
        uid,
        email,
        name: displayName || null,
        avatarUrl: photoURL || null,
        role: isAdmin ? "ADMIN" : "MEMBER",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      const isAdmin = email === "michael@mappisc.com.br";
      await userRef.update({
        email,
        name: displayName || null,
        avatarUrl: photoURL || null,
        role: isAdmin ? "ADMIN" : "MEMBER", // Force admin for this email even if it existed as member
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}
