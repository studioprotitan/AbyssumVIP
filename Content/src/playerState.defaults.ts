// ============================================================
// PATCH FILE: CharacterSheet.tsx — Inventory null guard fix
// Error: Cannot convert undefined or null to object
//        at Object.entries (CharacterSheet.tsx:112)
//
// ROOT CAUSE: playerState.inventory is undefined when the
// CharacterSheet renders before state is hydrated, OR when
// the WarWitch portal initializes with an incomplete
// playerState object that omits the inventory key.
//
// FIXES APPLIED:
//   1. Null-coalesce guard on Object.entries call (line 112)
//   2. Defensive default export for DEFAULT_PLAYER_STATE
//   3. Inventory initialization helper
// ============================================================

// ── Fix 1: The one-line guard (apply directly in CharacterSheet.tsx) ──────────
//
// BEFORE (line 112):
//   {Object.entries(playerState.inventory).map(([id, quantity]) => {
//
// AFTER:
//   {Object.entries(playerState.inventory ?? {}).map(([id, quantity]) => {
//
// This is the minimum viable fix. The ?? {} ensures that if
// inventory is undefined or null, it falls back to an empty
// object and the map simply renders nothing instead of crashing.

// ── Fix 2: Defensive playerState default (add to your state init) ─────────────
//
// In page.tsx or wherever playerState is defined, ensure the
// initial state always includes an inventory key:

export const DEFAULT_PLAYER_STATE = {
  // Core identity
  name: "Commander",
  level: 1,
  xp: 0,
  xpToNext: 100,

  // Vitals
  hp: 100,
  maxHp: 100,
  mana: 50,
  maxMana: 50,

  // Currency
  gold: 0,
  riftFragments: 0,

  // Progression
  completedEncounters: [] as string[],
  activeChapter: 1,

  // ── INVENTORY — always an object, never undefined ──────────
  // Key: ingredient/item ID string
  // Value: quantity number
  inventory: {} as Record<string, number>,

  // Equipped / unlocked spells
  spells: [] as string[],

  // NFT collection
  nftCollection: [] as Array<{
    id: string;
    name: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    mintedAt?: number;
  }>,

  // Character stats (used by CharacterSheet)
  stats: {
    strength:     10,
    agility:      10,
    intelligence: 10,
    endurance:    10,
    riftAffinity: 0,
  },

  // CST mission context (for Diesel City runtime)
  missionState: {
    currentOp:     "M01",
    currentSector: "SECTOR-3",
    ward:          "WARD 7 — INDUSTRIAL FORGE",
    stores:        0,
    maxStores:     48,
    rift:          "NOMINAL",
    fuel:          84,
  },
};

export type PlayerState = typeof DEFAULT_PLAYER_STATE;

// ── Fix 3: Safe inventory helper ──────────────────────────────────────────────
//
// Use this anywhere you need to read/write inventory to avoid
// the same class of crash in other components (Alchemy, Loot, etc.)

export function getInventorySafe(
  playerState: Partial<PlayerState>
): Record<string, number> {
  return playerState?.inventory ?? {};
}

export function addToInventory(
  playerState: PlayerState,
  itemId: string,
  quantity: number = 1
): PlayerState {
  const current = getInventorySafe(playerState);
  return {
    ...playerState,
    inventory: {
      ...current,
      [itemId]: (current[itemId] ?? 0) + quantity,
    },
  };
}

export function removeFromInventory(
  playerState: PlayerState,
  itemId: string,
  quantity: number = 1
): PlayerState {
  const current = getInventorySafe(playerState);
  const newQty = (current[itemId] ?? 0) - quantity;
  const updated = { ...current };
  if (newQty <= 0) {
    delete updated[itemId];
  } else {
    updated[itemId] = newQty;
  }
  return { ...playerState, inventory: updated };
}

// ── Fix 4: Paste this directly into CharacterSheet.tsx ────────────────────────
//
// Replace the existing inventory render block (around line 110-120) with:
//
//   const inventoryEntries = Object.entries(playerState?.inventory ?? {});
//
//   {inventoryEntries.length === 0 ? (
//     <div className="codex-note">
//       <strong>INVENTORY EMPTY</strong> — Gather ingredients from the field.
//     </div>
//   ) : (
//     inventoryEntries.map(([id, quantity]) => {
//       const ingredient = INGREDIENTS.find(i => i.id === id);
//       if (!ingredient) return null;
//       return (
//         <div key={id} className="stat-row">
//           <span className="stat-label">{ingredient.name}</span>
//           <span className="stat-value text-forge">×{quantity}</span>
//         </div>
//       );
//     })
//   )}
