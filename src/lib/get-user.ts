import { cookies } from "next/headers";
import { getAdminAuth } from "./firebase-admin";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) return null;

  try {
    const decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    
    // Get additional user data from Firestore if needed, 
    // but for role checks, let's assume we might have it in custom claims 
    // or we fetch it from Firestore here.
    const { getAdminFirestore } = await import("./firebase-admin");
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    
    if (!userDoc.exists) return null;
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...userDoc.data(),
    } as any;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}
