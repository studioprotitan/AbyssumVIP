import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { initFirebase, SentinelLog } from "./SentinelLogger";
import { SSOT } from "./SSOT";
import { DEFAULT_PLAYER_STATE, PlayerState } from "./playerState.defaults";
import { MOAI } from "./MOAI";
import { updatePlayerPosition } from "./SSOT";

/**
 * PersistenceManager.ts
 * Handlers for SSOT -> Firestore sync
 */
export class PersistenceManager {
  private static COLLECTION = "player_persistence";

  /**
   * Saves current SSOT and local player state to Firestore
   * @param playerState The current React/State state to persist
   */
  static async saveState(playerState: PlayerState): Promise<void> {
    try {
      const db = initFirebase(); // Retrieves the existing instance
      const playerDoc = doc(db, this.COLLECTION, SSOT.player.id);

      const payload = {
        ...playerState,
        lastPosition: SSOT.player.position,
        updatedAt: serverTimestamp(),
        build: SSOT.build,
        phase: SSOT.phase
      };

      await setDoc(playerDoc, payload, { merge: true });
      
      SentinelLog.ssot("STATE_SAVE_SUCCESS", `Persistence locked for ${SSOT.player.id}`);
      MOAI.broadcast("PERSISTENCE_SAVED", { playerId: SSOT.player.id });
    } catch (err) {
      SentinelLog.fail("STATE_SAVE_FAILURE", "SSOT", (err as Error).message);
    }
  }

  /**
   * Loads state from Firestore and merges with DEFAULT_PLAYER_STATE
   * @returns Merged PlayerState
   */
  static async loadState(): Promise<PlayerState> {
    try {
      const db = initFirebase();
      const playerDoc = doc(db, this.COLLECTION, SSOT.player.id);
      const snap = await getDoc(playerDoc);

      if (snap.exists()) {
        const data = snap.data() as PlayerState & { lastPosition: any };
        
        // Update the global SSOT position for the Babylon runtime
        if (data.lastPosition) {
          updatePlayerPosition(data.lastPosition.x, data.lastPosition.y, data.lastPosition.z);
        }

        SentinelLog.ssot("STATE_LOAD_SUCCESS", `Welcome back, ${SSOT.player.id}`);
        return { ...DEFAULT_PLAYER_STATE, ...data };
      }

      SentinelLog.ssot("STATE_NEW_PLAYER", "No previous state found, using defaults");
      return DEFAULT_PLAYER_STATE;
    } catch (err) {
      SentinelLog.fail("STATE_LOAD_FAILURE", "SSOT", (err as Error).message);
      return DEFAULT_PLAYER_STATE;
    }
  }
}