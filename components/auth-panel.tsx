"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth, firebaseConfigured } from "@/lib/firebase";

export default function AuthPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!auth) return;
    setBusy(true);
    setMessage("");

    try {
      if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        setMessage("Account created. Your cloud space is ready.");
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setMessage("Signed in successfully.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to continue.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!auth || !email.trim()) {
      setMessage("Enter your email address first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("Password reset email sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send reset email.");
    }
  }

  if (!firebaseConfigured) {
    return (
      <section className="card">
        <h2>Cloud account not connected yet</h2>
        <p className="muted">
          Abrar OS is still working with local browser storage. Add the Firebase environment variables in Vercel to activate free cloud login and syncing.
        </p>
      </section>
    );
  }

  if (user) {
    return (
      <section className="card">
        <h2>Cloud account</h2>
        <p className="muted">Signed in as {user.email}</p>
        <button className="primary-button" onClick={() => auth && signOut(auth)}>Sign out</button>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{mode === "login" ? "Sign in" : "Create your account"}</h2>
      <p className="muted">Email and password only. No SMS, card or paid Firebase services.</p>
      <form className="form-grid section-gap" onSubmit={submit}>
        <label className="field full-field">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label className="field full-field">Password<input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <button className="primary-button full-field" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
      <div className="inline-pills section-gap">
        <button className="quick" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create account" : "Back to sign in"}</button>
        <button className="quick" onClick={resetPassword}>Reset password</button>
      </div>
      {message && <p className="muted section-gap">{message}</p>}
    </section>
  );
}
