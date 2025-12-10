import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, UserCredential, Auth } from "firebase/auth";
import app from "./firebaseConfig";

// Primary auth follows the logged-in user session
const primaryAuth = getAuth(app);

// Secondary auth lets us create users without hijacking the current session
let secondaryAuth: Auth | null = null;
try {
  const existing = getApps().find(a => a.name === 'adminSecondary');
  const secondaryApp: FirebaseApp = existing ?? initializeApp(app.options as any, 'adminSecondary');
  secondaryAuth = getAuth(secondaryApp);
} catch (error) {
  console.warn("Secondary auth init failed; user creation will be disabled until this is resolved.", error);
}

export const authService = {
  async createAuthUser(email: string, password: string): Promise<UserCredential> {
    if (!secondaryAuth) {
      throw new Error("secondary-auth-unavailable");
    }
    return createUserWithEmailAndPassword(secondaryAuth, email, password);
  },
  async signIn(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(primaryAuth, email, password);
  },
  async signOut(): Promise<void> {
    return signOut(primaryAuth);
  }
};
