import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, upsertUser, upsertSubscription } from "@/lib/firestore";

async function requireAdmin() {
  const { userId } = await getServerAuth();
  if (!userId) return null;
  const user = await getUserByUid(userId);
  return user?.role === "ADMIN" ? user : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const { role, subscriptionStatus, subscriptionPeriodEnd, stripeCustomerId, stripeSubscriptionId, stripePriceId } = body;

  // Update user role if provided
  if (role !== undefined) {
    const target = await getUserByUid(id);
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    await upsertUser({ uid: id, email: target.email, role });
  }

  // Update subscription if any subscription fields are provided
  const subData: Record<string, unknown> = {};
  if (subscriptionStatus !== undefined) subData.status = subscriptionStatus;
  if (subscriptionPeriodEnd !== undefined) subData.currentPeriodEnd = subscriptionPeriodEnd;
  if (stripeCustomerId !== undefined) subData.stripeCustomerId = stripeCustomerId;
  if (stripeSubscriptionId !== undefined) subData.stripeSubscriptionId = stripeSubscriptionId;
  if (stripePriceId !== undefined) subData.stripePriceId = stripePriceId;

  if (Object.keys(subData).length > 0) {
    await upsertSubscription(id, subData);
  }

  return NextResponse.json({ success: true });
}
