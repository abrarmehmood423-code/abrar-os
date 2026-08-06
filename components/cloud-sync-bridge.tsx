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

export default function CloudSyncBridge() {
  useEffect(() => {
    if (!auth) return;

    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled || !user) {
        if (!user) sessionStorage.removeItem(SESSION_SYNC_KEY);
        return;
      }

      const sessionKey = `${SESSION_SYNC_KEY}:${user.uid}`;
      if (sessionStorage.getItem(sessionKey) === "1") {
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
          sessionStorage.setItem(sessionKey, "1");
          flushPendingCloudSave();
          return;
        }

        const cloudIsNewer = !local.updatedAt || cloud.updatedAt > local.updatedAt;

        if (cloudIsNewer) {
          saveLocalData(cloud.data, cloud.updatedAt || new Date().toISOString());
          sessionStorage.setItem(sessionKey, "1");
          window.location.reload();
          return;
        }

        if (local.updatedAt > cloud.updatedAt) {
          await saveCloudData(local.data, local.updatedAt);
        }

        sessionStorage.setItem(sessionKey, "1");
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
