"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { hashPin, loadSettings } from "@/lib/settings-store";

const SESSION_UNLOCKED_KEY = "abrar-os-session-unlocked";

export default function PrivacyGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyLockState = useCallback(() => {
    const settings = loadSettings();
    const hasPin = Boolean(settings.pinHash);
    const unlockedThisSession = sessionStorage.getItem(SESSION_UNLOCKED_KEY) === "yes";
    setLocked(hasPin && !unlockedThisSession);
    setReady(true);
  }, []);

  const scheduleAutoLock = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const settings = loadSettings();
    if (!settings.pinHash || settings.autoLockMinutes <= 0) return;
    timerRef.current = setTimeout(() => {
      sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
      setLocked(true);
      setPin("");
      setError("");
    }, settings.autoLockMinutes * 60_000);
  }, []);

  useEffect(() => {
    applyLockState();
  }, [applyLockState]);

  useEffect(() => {
    if (!ready || locked) return;
    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart", "scroll"];
    const onActivity = () => scheduleAutoLock();
    events.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    scheduleAutoLock();
    return () => {
      events.forEach((event) => window.removeEventListener(event, onActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [locked, ready, scheduleAutoLock]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") applyLockState();
    };
    window.addEventListener("storage", applyLockState);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("storage", applyLockState);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [applyLockState]);

  async function unlock(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{4,8}$/.test(pin)) {
      setError("Enter your 4 to 8 digit PIN.");
      return;
    }
    const settings = loadSettings();
    const enteredHash = await hashPin(pin);
    if (!settings.pinHash || enteredHash !== settings.pinHash) {
      setError("Incorrect PIN.");
      setPin("");
      return;
    }
    sessionStorage.setItem(SESSION_UNLOCKED_KEY, "yes");
    setLocked(false);
    setPin("");
    setError("");
  }

  if (!ready) return <main className="loading-screen">Opening Abrar OS…</main>;

  if (locked) {
    return (
      <main className="privacy-screen">
        <section className="privacy-card">
          <div className="privacy-icon"><LockKeyhole size={30} /></div>
          <span className="pill success"><ShieldCheck size={13} /> Private workspace</span>
          <h1>Abrar OS is locked</h1>
          <p className="muted">Enter your PIN to access health, financial, family and immigration records stored on this device.</p>
          <form onSubmit={unlock} className="privacy-form">
            <input
              autoFocus
              inputMode="numeric"
              type="password"
              pattern="[0-9]*"
              maxLength={8}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
              placeholder="Enter PIN"
              aria-label="Privacy PIN"
            />
            <button className="primary-button" type="submit">Unlock</button>
          </form>
          {error && <p className="privacy-error" role="alert">{error}</p>}
          <p className="privacy-help">The PIN cannot be recovered. A reset requires clearing this browser’s Abrar OS data.</p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
