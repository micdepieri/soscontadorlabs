import * as admin from "firebase-admin";

function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccount) {
    try {
      // Sometimes environmental variable loaders include quotes
      if (serviceAccount.startsWith("'") && serviceAccount.endsWith("'")) {
        serviceAccount = serviceAccount.slice(1, -1);
      }
      if (serviceAccount.startsWith('"') && serviceAccount.endsWith('"')) {
        serviceAccount = serviceAccount.slice(1, -1);
      }

      const parsed = JSON.parse(serviceAccount);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      console.log("Initializing Firebase Admin with project:", parsed.project_id);
      return admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
    } catch (e: any) {
      console.error("Firebase Admin JSON Parse/Init Error:", e.message || e);
      throw new Error(`Firebase Admin SDK Init Failed: ${e.message}`);
    }
  }

  // Only reach here if serviceAccount is not defined
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export function getAdminAuth() {
  getFirebaseAdmin();
  return admin.auth();
}

export function getAdminFirestore() {
  getFirebaseAdmin();
  return admin.firestore();
}
