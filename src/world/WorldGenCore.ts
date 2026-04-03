'use client';

/**
 * WorldGenCore.ts
 * Authoritative World Generation Core
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

  // STABILITY_CHECK patch applied line 259
  public validateWorldState(state: any) {
    if (!state) {
      console.warn('[STABILITY_CHECK] WORLD_STATE null. Initializing default.');
      return { status: 'LIVE' };
    }
    return state;
  }
}

export const globalWorldGen = WorldGenCore.getInstance();
