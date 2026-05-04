// e:\AbyssumVIP\Data\core\SSOT.ts
export const SSOT = {
  build: "v1.5.2",
  phase: "8.4",

  player: {
    id: "SALEIGHA",
    identityStability: 100,
    // Mutable position for Babylon camera binding
    position: { x: 0, y: 1.0, z: 0 },
    health: 100,
    fuel: 84,
  },

  system: {
    resonanceLevel: 0,
    overseerState: "dormant" as const,
    aquilaLink: false,
  },
} as const satisfies Record<string, unknown>;

// Helper to update position despite 'as const'
export const updatePlayerPosition = (x: number, y: number, z: number) => {
  (SSOT.player.position as any).x = x;
  (SSOT.player.position as any).y = y;
  (SSOT.player.position as any).z = z;
};

// Helper to update vitals
export const updatePlayerVitals = (health: number, fuel: number) => {
  const p = SSOT.player as any;
  if (health !== undefined) p.health = health;
  if (fuel !== undefined) p.fuel = fuel;
};