'use client';

/**
 * WorldGenCore.ts
 * Authoritative World Generation Core — Phase 8.5
 * Implements SSOT validation for grid stability.
 */

export class WorldGenCore {
  private static instance: WorldGenCore;
  private constructor() {}

  public static getInstance(): WorldGenCore {
    if (!WorldGenCore.instance) {
      WorldGenCore.instance = new WorldGenCore();
    }
    return WorldGenCore.instance;
  }

  /**
   * STABILITY_CHECK validation logic (formerly SENTINEL_DRIFT)
   * Ensures world state aligns with SSOT before rendering.
   */
  public validateWorldState(state: any) {
    if (!state) {
      console.warn('[STABILITY_CHECK] WORLD_STATE null. Booting default substrate.');
      return { status: 'LIVE', origin: 'DRIVE_CORE' };
    }
    
    // Check for drift in coordinates or mesh data
    if (state.drift > 0.8) {
      console.error('[STABILITY_CHECK] CRITICAL DRIFT. Triggering Relay Reset.');
      return { ...state, status: 'FAULT' };
    }

    return { ...state, status: 'LIVE' };
  }
}

export const globalWorldGen = WorldGenCore.getInstance();
