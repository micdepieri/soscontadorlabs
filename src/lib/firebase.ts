import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Firebase App Hosting provides FIREBASE_WEBAPP_CONFIG at build time.
// next.config.ts parses it into NEXT_PUBLIC_FIREBASE_* vars at build time.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy initialization: Firebase Client SDK is browser-only.
// getAuth/getFirestore/getStorage throw during SSR when config is missing.
let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;
let _storage: FirebaseStorage | undefined;

function getApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return _app;
}

function lazyProxy<T extends object>(factory: () => T): T {
  return new Proxy({} as T, {
    get(_, prop) {
      return (factory() as any)[prop];
    },
    set(_, prop, value) {
      // Sem esse trap, escritas como `db._firestoreClient = new FirestoreClient()`
      // iam para o target `{}`, não para a instância real. Leituras subsequentes
      // via factory voltavam undefined, causando erros de asyncQueue etc.
      (factory() as any)[prop] = value;
      return true;
    },
    getPrototypeOf(_) {
      // `instanceof` usa [[GetPrototypeOf]] — sem esse trap, Proxy com target {}
      // falha checks como `db instanceof Firestore` dentro do SDK do Firebase.
      if (typeof window === "undefined") return Object.prototype;
      return Object.getPrototypeOf(factory());
    },
  });
}

export const auth: Auth = lazyProxy(() => {
  if (!_auth) _auth = getAuth(getApp());
  return _auth;
});

export const db: Firestore = lazyProxy(() => {
  if (!_db) _db = getFirestore(getApp());
  return _db;
});

export const storage: FirebaseStorage = lazyProxy(() => {
  if (!_storage) _storage = getStorage(getApp());
  return _storage;
});

export default { getApp };
