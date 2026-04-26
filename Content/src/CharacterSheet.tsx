import React from 'react';
import { PlayerState } from './playerState.defaults';

// Assuming INGREDIENTS is defined elsewhere; if not, define it here or import
const INGREDIENTS = [
  // Example ingredients; replace with actual definitions
  { id: 'herb', name: 'Mystic Herb' },
  { id: 'crystal', name: 'Rift Crystal' },
  // Add more as needed
];

interface CharacterSheetProps {
  playerState: PlayerState;
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ playerState }) => {
  const inventoryEntries = Object.entries(playerState?.inventory ?? {});

  return (
    <div className="character-sheet">
      {/* Other character sheet content */}

      {/* Inventory Section */}
      <div className="inventory-section">
        <h3>INVENTORY</h3>
        {inventoryEntries.length === 0 ? (
          <div className="codex-note">
            <strong>INVENTORY EMPTY</strong> — Gather ingredients from the field.
          </div>
        ) : (
          inventoryEntries.map(([id, quantity]) => {
            const ingredient = INGREDIENTS.find(i => i.id === id);
            if (!ingredient) return null;
            return (
              <div key={id} className="stat-row">
                <span className="stat-label">{ingredient.name}</span>
                <span className="stat-value text-forge">×{quantity}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Other sections */}
    </div>
  );
};

export default CharacterSheet;