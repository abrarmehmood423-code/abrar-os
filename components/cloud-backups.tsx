"use client";

import { onAuthStateChanged } from "firebase/auth";
import { Cloud, RefreshCw, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { listCloudBackups, restoreCloudBackup, type CloudBackup } from "@/lib/storage";

export default function CloudBackups() {
  const [backups, setBackups] = useState<CloudBackup[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    if (!auth?.currentUser) {
      setBackups([]);
      setSignedIn(false);
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      setSignedIn(true);
      setBackups(await listCloudBackups());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load cloud backups.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, () => void refresh());
  }, []);

  async function restore(backup: CloudBackup) {
    if (!confirm(`Restore the backup from ${new Date(backup.createdAt).toLocaleString("en-GB")}? Current data will be replaced.`)) return;

    setBusy(true);
    setMessage("");
    try {
      await restoreCloudBackup(backup.id);
      setMessage("Backup restored. Reloading Abrar OS…");
      window.setTimeout(() => window.location.assign("/"), 800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to restore this backup.");
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>Cloud restore points</h2>
          <p className="muted">One free restore point is created automatically each day you use Abrar OS while signed in.</p>
        </div>
        <Cloud size={20}/>
      </div>

      {!signedIn ? (
        <p className="muted">Sign in through Cloud account to create and restore cloud backups.</p>
      ) : backups.length ? (
        <div className="list">
          {backups.map((backup) => (
            <div className="item" key={backup.id}>
              <div>
                <strong>{new Date(backup.createdAt).toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short", year:"numeric" })}</strong>
                <span>Created {new Date(backup.createdAt).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" })}</span>
              </div>
              <button className="quick" disabled={busy} onClick={() => void restore(backup)}><RotateCcw size={15}/>Restore</button>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">No cloud restore points yet. Your first one will be created after the next signed-in data change.</p>
      )}

      <div className="section-gap">
        <button className="quick" disabled={busy || !signedIn} onClick={() => void refresh()}><RefreshCw size={15}/>{busy ? "Checking…" : "Refresh history"}</button>
      </div>
      {message && <p className="muted section-gap">{message}</p>}
    </section>
  );
}
