"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface User extends FirebaseUser {
  role?: "MEMBER" | "ADMIN";
  name?: string;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Listen to Firestore document for role and additional data
        const userRef = doc(db, "users", firebaseUser.uid);
        const unsubDoc = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setUser({
              ...firebaseUser,
              role: data.role,
              name: data.name,
              avatarUrl: data.avatarUrl,
            });
          } else {
            setUser(firebaseUser as User);
          }
          setLoading(false);
        });
        return () => unsubDoc();
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return <AuthContext value={{ user, loading }}>{children}</AuthContext>;
}

export function useAuth() {
  return useContext(AuthContext);
}
