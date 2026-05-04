import React from 'react';

type LandingScreenProps = {
  onEnterGrid?: () => void;
};

export const LandingScreen: React.FC<LandingScreenProps> = ({ onEnterGrid }) => {
  return (
    <div className="landing-screen-container">
      <h1 className="landing-screen-title">
        CALIBRATE SYNC
      </h1>
      <p className="landing-screen-subtitle">
        The resonance is shifting...
      </p>
      <button
        onClick={onEnterGrid}
        className="landing-screen-button"
      >
        ENTER THE GRID
      </button>
    </div>
  );
};

export default LandingScreen;