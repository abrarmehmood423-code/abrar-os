import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";

// Firebase web configuration is public client configuration.
// Access control is enforced by Firebase Authentication and Firestore rules.
const firebaseConfig = {
  apiKey: "AIzaSyDti1JquZYbYIDJkEOK4bmNzKSSfCb1ttI",
  authDomain: "abrar-os.firebaseapp.com",
  projectId: "abrar-os",
  storageBucket: "abrar-os.firebasestorage.app",
  messagingSenderId: "1006198193128",
  appId: "1:1006198193128:web:e0b4bad0073f3a81a9425d",
};

export const missingFirebaseVariables: string[] = [];
export const firebaseConfigured = true;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
auth = getAuth(app);

// Prefer the configured Firestore instance on every initialization path, including
// development hot reloads and multi-entry builds. If Firestore was already created,
// reuse that singleton rather than throwing or creating another connection.
try {
  db = initializeFirestore(app, { ignoreUndefinedProperties: true });
} catch {
  db = getFirestore(app);
}

export { app, auth, db };
