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
  starterData,
  type DataSnapshot,
} from "@/lib/storage";

const SESSION_SYNC_KEY = "abrar-os-cloud-sync-complete";
const CLOUD_RETRY_KEY = "abrar-os-cloud-sync-retry-after";
const CLOUD_READ_ATTEMPTS = 3;
const CLOUD_READ_RETRY_COOLDOWN_MS = 60_000;

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

function readRetryAfter(key: string): number {
  try {
    const value = Number(window.sessionStorage.getItem(key));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeRetryAfter(key: string): void {
  try {
    window.sessionStorage.setItem(
      key,
      String(Date.now() + CLOUD_READ_RETRY_COOLDOWN_MS),
    );
  } catch {
    // A blocked session store must not prevent cloud recovery attempts.
  }
}

function clearUserSyncState(uid: string): void {
  clearSessionFlag(`${SESSION_SYNC_KEY}:${uid}`);
  clearSessionFlag(`${CLOUD_RETRY_KEY}:${uid}`);
}

function parseTimestamp(value: string): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function dataMatches(left: DataSnapshot["data"], right: DataSnapshot["data"]): boolean {
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
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
    let previousUid = authInstance.currentUser?.uid ?? null;

    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      if (cancelled) return;

      if (!user) {
        if (previousUid) clearUserSyncState(previousUid);
        previousUid = null;
        return;
      }

      if (previousUid && previousUid !== user.uid) {
        clearUserSyncState(previousUid);
      }
      previousUid = user.uid;

      const sessionKey = `${SESSION_SYNC_KEY}:${user.uid}`;
      const retryKey = `${CLOUD_RETRY_KEY}:${user.uid}`;
      if (readSessionFlag(sessionKey)) {
        flushPendingCloudSave();
        return;
      }

      if (readRetryAfter(retryKey) > Date.now()) {
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
          // Apply a short session cooldown so rapid reloads do not repeat three
          // inconclusive reads, while a later page load can still recover safely.
          writeRetryAfter(retryKey);
          flushPendingCloudSave();
          return;
        }

        clearSessionFlag(retryKey);
        const localTime = parseTimestamp(local.updatedAt);
        const cloudTime = parseTimestamp(cloud.updatedAt);
        const localIsUninitialised = local.data === starterData && !local.updatedAt;
        const cloudIsNewer =
          cloudTime !== null && (localTime === null || cloudTime > localTime);
        const legacyCloudIsOnlyKnownData = localIsUninitialised && cloudTime === null;

        if (cloudIsNewer || legacyCloudIsOnlyKnownData) {
          saveLocalData(cloud.data, cloud.updatedAt || new Date().toISOString());
          writeSessionFlag(sessionKey);
          window.location.reload();
          return;
        }

        if (
          localTime !== null &&
          cloudTime !== null &&
          localTime === cloudTime &&
          !dataMatches(local.data, cloud.data)
        ) {
          // Equal timestamps with different payloads are ambiguous. This can
          // happen if two clients save within the same millisecond. Never pick a
          // winner automatically: keep both copies untouched and retry later.
          writeRetryAfter(retryKey);
          flushPendingCloudSave();
          return;
        }

        if (localTime !== null && cloudTime !== null && localTime > cloudTime) {
          await saveCloudData(local.data, local.updatedAt, user.uid);
          if (!shouldContinue()) return;

          // The Firestore transaction may safely reject this write if another
          // client updated the cloud document after our first read. Re-read once
          // before marking sync complete so that a concurrent cloud update is not
          // hidden for the remainder of this browser session.
          const confirmedCloud = await loadCloudSnapshot();
          if (!shouldContinue()) return;
          if (!confirmedCloud) {
            writeRetryAfter(retryKey);
            flushPendingCloudSave();
            return;
          }

          const confirmedCloudTime = parseTimestamp(confirmedCloud.updatedAt);
          if (confirmedCloudTime === null) {
            writeRetryAfter(retryKey);
            flushPendingCloudSave();
            return;
          }

          if (confirmedCloudTime > localTime) {
            saveLocalData(confirmedCloud.data, confirmedCloud.updatedAt);
            writeSessionFlag(sessionKey);
            window.location.reload();
            return;
          }

          if (
            confirmedCloudTime === localTime &&
            !dataMatches(local.data, confirmedCloud.data)
          ) {
            writeRetryAfter(retryKey);
            flushPendingCloudSave();
            return;
          }
        } else if (localTime === null || cloudTime === null) {
          // If either side has persisted data but no trustworthy timestamp, its
          // age is unknown. Do not guess and automatically overwrite either side.
          writeRetryAfter(retryKey);
          flushPendingCloudSave();
          return;
        }

        if (!shouldContinue()) return;
        writeSessionFlag(sessionKey);
        flushPendingCloudSave();
      } catch (error) {
        console.error("Abrar OS cloud synchronisation failed", error);
        writeRetryAfter(retryKey);
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
