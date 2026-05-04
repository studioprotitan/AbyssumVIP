// ============================================================
// SentinelLogger.ts — Phase 8.4 Step C
// Firebase + SENTINEL Persistence Layer
// Abyssum Gateway v1.5.2 · commit 98d1533
// ============================================================
// SSOT Compliance  : All writes flow through logEvent()
// MOAI Compliance  : All cross-system events via MOAI.broadcast
// Authority        : SENTINEL is the EXCLUSIVE log writer
// Entropy Guard    : throttleEntropy() wraps every write
// ============================================================

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  DocumentData,
} from "firebase/firestore";

import { SSOT } from "./SSOT";
import { MOAI } from "./MOAI";
import { SENTINEL } from "./SENTINEL";
import { throttleEntropy } from "./entropy";

// ── Types ─────────────────────────────────────────────────────

export type LogLevel = "info" | "warn" | "error" | "compliance" | "trace";

export type AgentSource =
  | "COPILOT"
  | "CHATGPT"
  | "GEMINI"
  | "SENTINEL"
  | "SYSTEM"
  | "PLAYER"
  | "FORGE"
  | "FIREBASE";

export type ComplianceStatus = "PASS" | "FAIL" | "WARN" | "PENDING";

export interface SentinelLogEntry {
  // Identity
  sessionId: string;
  build: string;
  phase: string;
  playerId: string;

  // Event
  event: string;
  level: LogLevel;
  source: AgentSource;
  message: string;

  // Compliance
  layer: "SSOT" | "MOAI" | "SENTINEL" | "ENTROPY" | "PHYSICS" | "INPUT" | "ASSET" | "ENGINE" | "GATE";
  complianceStatus: ComplianceStatus;
  moaiRouted: boolean;

  // Runtime state snapshot
  snapshot: {
    resonanceLevel: number;
    overseerState: string;
    aquilaLink: boolean;
    entropyCount: number;
  };

  // Payload (arbitrary — keep lightweight)
  payload?: Record<string, unknown>;

  // Timestamps
  clientTime: number;        // Date.now()
  serverTime?: unknown;      // serverTimestamp() — filled by Firestore
}

export interface ComplianceEventLog {
  auditId: string;
  commitHash: string;
  timestamp: number;
  checks: Array<{
    layer: string;
    status: ComplianceStatus;
    detail: string;
  }>;
  overallResult: "TRUE" | "ERROR";
}

// ── Firebase init (idempotent) ─────────────────────────────────

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;

export function initFirebase(config: {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}): Firestore {
  if (_db) return _db;

  _app = getApps().length
    ? getApps()[0]
    : initializeApp(config, "abyssum-gateway");

  _db = getFirestore(_app);
  console.log("[FIREBASE] Firestore initialised — project:", config.projectId);
  return _db;
}

function getDb(): Firestore {
  if (!_db) {
    throw new Error(
      "[SENTINEL] Firebase not initialised. Call initFirebase() before logging."
    );
  }
  return _db;
}

// ── Session ID (per browser session, not persisted) ───────────

let _sessionId: string | null = null;

function getSessionId(): string {
  if (!_sessionId) {
    _sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
  return _sessionId;
}

// ── Entropy counter mirror (read from module, not duplicated) ──

let _localEntropyMirror = 0;

export function syncEntropyMirror(count: number) {
  _localEntropyMirror = count;
}

// ── Core log writer ───────────────────────────────────────────

export async function logEvent(
  event: string,
  level: LogLevel,
  source: AgentSource,
  layer: SentinelLogEntry["layer"],
  message: string,
  options: {
    complianceStatus?: ComplianceStatus;
    payload?: Record<string, unknown>;
    moaiRouted?: boolean;
  } = {}
): Promise<void> {
  // ENTROPY GUARD — non-negotiable
  if (!throttleEntropy()) {
    console.warn("[SENTINEL LOGGER] Entropy limit — log dropped:", event);
    return;
  }

  // Register with in-memory SENTINEL first
  SENTINEL.register(event, source);

  const entry: SentinelLogEntry = {
    sessionId: getSessionId(),
    build: SSOT.build,
    phase: SSOT.phase,
    playerId: SSOT.player.id,

    event,
    level,
    source,
    message,
    layer,
    complianceStatus: options.complianceStatus ?? "PASS",
    moaiRouted: options.moaiRouted ?? false,

    snapshot: {
      resonanceLevel: SSOT.system.resonanceLevel,
      overseerState:  SSOT.system.overseerState,
      aquilaLink:     SSOT.system.aquilaLink,
      entropyCount:   _localEntropyMirror,
    },

    payload:    options.payload,
    clientTime: Date.now(),
    serverTime: serverTimestamp(),
  };

  try {
    const db = getDb();
    const colRef = collection(db, "sentinel_logs");
    await addDoc(colRef, entry);

    // MOAI broadcast for cross-agent visibility
    MOAI.broadcast("SENTINEL_LOG", {
      event,
      level,
      source,
      layer,
      status: entry.complianceStatus,
    });
  } catch (err) {
    // Never throw from logger — degrade gracefully
    console.error("[SENTINEL LOGGER] Firebase write failed:", err);
    SENTINEL.alert("FIREBASE_WRITE_FAILURE", { event, err });
  }
}

// ── Compliance audit writer ────────────────────────────────────

export async function writeComplianceAudit(
  commitHash: string,
  checks: ComplianceEventLog["checks"],
  overallResult: "TRUE" | "ERROR"
): Promise<void> {
  const audit: ComplianceEventLog = {
    auditId: `audit_${Date.now()}`,
    commitHash,
    timestamp: Date.now(),
    checks,
    overallResult,
  };

  try {
    const db = getDb();
    await addDoc(collection(db, "compliance_audits"), audit);
    console.log("[SENTINEL] Compliance audit written:", audit.auditId);
    MOAI.broadcast("COMPLIANCE_AUDIT_WRITTEN", audit);
  } catch (err) {
    console.error("[SENTINEL] Compliance audit write failed:", err);
  }
}

// ── MOAI conflict trace writer ─────────────────────────────────

export async function logMoaiConflict(
  conflictingSource: AgentSource,
  event: string,
  conflictData: unknown
): Promise<void> {
  await logEvent(
    "MOAI_CONFLICT",
    "error",
    "SENTINEL",
    "MOAI",
    `Multi-AI conflict on event "${event}" — sources: SENTINEL vs ${conflictingSource}`,
    {
      complianceStatus: "FAIL",
      moaiRouted: true,
      payload: { conflictingSource, originalEvent: event, conflictData },
    }
  );
}

// ── Gate transition trace ──────────────────────────────────────

export async function logGateEvent(
  resonanceLevel: number,
  unlocked: boolean
): Promise<void> {
  await logEvent(
    unlocked ? "GATE_UNLOCK" : "GATE_LOCKED",
    unlocked ? "info" : "warn",
    "SYSTEM",
    "GATE",
    unlocked
      ? `Gate unlocked — resonanceLevel: ${resonanceLevel}`
      : `Gate transition attempted — resonanceLevel ${resonanceLevel} < 3`,
    {
      complianceStatus: unlocked ? "PASS" : "WARN",
      moaiRouted: true,
      payload: { resonanceLevel, threshold: 3, unlocked },
    }
  );

  if (unlocked) {
    MOAI.broadcast("GATE_UNLOCK", { resonanceLevel });
  }
}

// ── Echo Guardian spawn trace ──────────────────────────────────

export async function logEchoGuardianSpawn(playerId: string): Promise<void> {
  await logEvent(
    "SPAWN_ECHO_GUARDIAN",
    "info",
    "SYSTEM",
    "ASSET",
    `Echo Guardian spawned — linked to player: ${playerId}`,
    {
      complianceStatus: "PASS",
      moaiRouted: true,
      payload: { linkedTo: playerId, build: SSOT.build },
    }
  );
  MOAI.broadcast("SPAWN_ECHO_GUARDIAN", { linkedTo: playerId });
}

// ── Real-time log subscriber (for dashboard) ───────────────────

export function subscribeToLogs(
  onEntry: (entry: DocumentData) => void,
  limitCount = 50
): Unsubscribe {
  const db = getDb();
  const q = query(
    collection(db, "sentinel_logs"),
    orderBy("clientTime", "desc"),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        onEntry(change.doc.data());
      }
    });
  });
}

export function subscribeToAudits(
  onAudit: (audit: DocumentData) => void
): Unsubscribe {
  const db = getDb();
  const q = query(
    collection(db, "compliance_audits"),
    orderBy("timestamp", "desc"),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        onAudit(change.doc.data());
      }
    });
  });
}

// ── Convenience wrappers ───────────────────────────────────────

export const SentinelLog = {
  ssot:    (event: string, msg: string, payload?: Record<string, unknown>) =>
    logEvent(event, "compliance", "SENTINEL", "SSOT",    msg, { payload }),
  moai:    (event: string, msg: string, payload?: Record<string, unknown>) =>
    logEvent(event, "trace",      "SENTINEL", "MOAI",    msg, { moaiRouted: true, payload }),
  physics: (event: string, msg: string, payload?: Record<string, unknown>) =>
    logEvent(event, "info",       "SYSTEM",   "PHYSICS", msg, { payload }),
  asset:   (event: string, msg: string, payload?: Record<string, unknown>) =>
    logEvent(event, "info",       "FORGE",    "ASSET",   msg, { payload }),
  engine:  (event: string, msg: string, payload?: Record<string, unknown>) =>
    logEvent(event, "info",       "SYSTEM",   "ENGINE",  msg, { payload }),
  fail:    (event: string, layer: SentinelLogEntry["layer"], msg: string, payload?: Record<string, unknown>) =>
    logEvent(event, "error",      "SENTINEL", layer,     msg, { complianceStatus: "FAIL", payload }),
};
