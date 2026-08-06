"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  flushPendingCloudSave,
  loadCloudSnapshot,
  loadLocalSnapshot,
  saveCloudData,
  saveLocalData,
} from "@/lib/storage";

const SESSION_SYNC_KEY = "abrar-os-cloud-sync-complete";

function readSessionFlag(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeSessionFlag(key: string): void {
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Session storage is only an optimisation; cloud sync must still continue.
  }
}

function clearSessionFlag(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore browsers that block session storage.
  }
}

export default function CloudSyncBridge() {
  useEffect(() => {
    if (!auth) return;

    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled || !user) {
        if (!user) clearSessionFlag(SESSION_SYNC_KEY);
        return;
      }

      const sessionKey = `${SESSION_SYNC_KEY}:${user.uid}`;
      if (readSessionFlag(sessionKey)) {
        flushPendingCloudSave();
        return;
      }

      try {
        const local = loadLocalSnapshot();
        const cloud = await loadCloudSnapshot();
        if (cancelled) return;

        if (!cloud) {
          // A missing result may also mean a temporary Firestore read failure.
          // Never auto-seed from local storage here because that could overwrite
          // an existing cloud document. Normal edits and the pending-save outbox
          // will safely create a new cloud document through timestamp checks.
          writeSessionFlag(sessionKey);
          flushPendingCloudSave();
          return;
        }

        const cloudIsNewer = !local.updatedAt || cloud.updatedAt > local.updatedAt;

        if (cloudIsNewer) {
          saveLocalData(cloud.data, cloud.updatedAt || new Date().toISOString());
          writeSessionFlag(sessionKey);
          window.location.reload();
          return;
        }

        if (local.updatedAt > cloud.updatedAt) {
          await saveCloudData(local.data, local.updatedAt);
        }

        writeSessionFlag(sessionKey);
        flushPendingCloudSave();
      } catch (error) {
        console.error("Abrar OS cloud synchronisation failed", error);
        flushPendingCloudSave();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return null;
}
