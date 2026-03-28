import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function getServerAuth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    return { userId: null, decodedToken: null };
  }

  try {
    const decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return { userId: decodedToken.uid, decodedToken };
  } catch {
    return { userId: null, decodedToken: null };
  }
}
