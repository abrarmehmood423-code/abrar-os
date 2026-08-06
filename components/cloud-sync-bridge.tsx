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
  type DataSnapshot,
} from "@/lib/storage";

const SESSION_SYNC_KEY = "abrar-os-cloud-sync-complete";
const CLOUD_READ_ATTEMPTS = 3;

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

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function loadConfirmedCloudSnapshot(
  shouldContinue: () => boolean,
): Promise<DataSnapshot | null> {
  for (let attempt = 1; attempt <= CLOUD_READ_ATTEMPTS; attempt += 1) {
    if (!shouldContinue()) return null;

    const snapshot = await loadCloudSnapshot();
    if (!shouldContinue() || snapshot) return snapshot;

    if (attempt < CLOUD_READ_ATTEMPTS) {
      await wait(400 * 2 ** (attempt - 1));
    }
  }

  return null;
}

export default function CloudSyncBridge() {
  useEffect(() => {
    const authInstance = auth;
    if (!authInstance) return;

    let cancelled = false;

    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      if (cancelled || !user) {
        if (!user) clearSessionFlag(SESSION_SYNC_KEY);
        return;
      }

      const sessionKey = `${SESSION_SYNC_KEY}:${user.uid}`;
      if (readSessionFlag(sessionKey)) {
        flushPendingCloudSave();
        return;
      }

      const shouldContinue = () =>
        !cancelled && authInstance.currentUser?.uid === user.uid;

      try {
        const local = loadLocalSnapshot();
        const cloud = await loadConfirmedCloudSnapshot(shouldContinue);
        if (!shouldContinue()) return;

        if (!cloud) {
          // A missing result may also mean a temporary Firestore read failure.
          // Confirm it with bounded retries and never auto-seed here, because an
          // inconclusive read must not allow local data to replace cloud data.
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
          await saveCloudData(local.data, local.updatedAt, user.uid);
        }

        if (!shouldContinue()) return;
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
