import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import {
  getUserByUid,
  getAllUsersXP,
  getXPOverview,
  getContentConsumptionStats,
  getUsers,
  LEVEL_LABELS,
} from "@/lib/firestore";

async function requireAdmin() {
  const { userId } = await getServerAuth();
  if (!userId) return null;
  const user = await getUserByUid(userId);
  return user?.role === "ADMIN" ? user : null;
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const [usersXP, overview, consumptionStats, allUsers] = await Promise.all([
      getAllUsersXP(),
      getXPOverview(),
      getContentConsumptionStats(),
      getUsers(),
    ]);

    const userMap = Object.fromEntries(allUsers.map((u) => [u.uid, u]));

    const leaderboard = usersXP.map((xp, index) => {
      const user = userMap[xp.userId];
      return {
        rank: index + 1,
        userId: xp.userId,
        name: user?.name || user?.email || "Membro",
        email: user?.email || "",
        avatarUrl: user?.avatarUrl || null,
        totalXP: xp.totalXP,
        level: xp.level,
        levelLabel: LEVEL_LABELS[xp.level] || "Iniciante",
        contentConsumed: xp.contentConsumed,
      };
    });

    // Top content by consumption
    const topContent = Object.entries(consumptionStats)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 20)
      .map(([contentId, stats]) => ({ contentId, ...stats }));

    return NextResponse.json({ overview, leaderboard, topContent });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Falha ao carregar analytics" }, { status: 500 });
  }
}
