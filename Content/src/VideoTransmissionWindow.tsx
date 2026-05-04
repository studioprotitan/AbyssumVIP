/**
 * VideoTransmissionWindow.tsx
 * Genesis Verse — Deploy Lobby Video Frame
 *
 * FIX: 9:16 portrait video was clipping (pilot head cut off).
 *
 * ROOT CAUSE:
 *   container was full-width with unconstrained height.
 *   object-fit: cover filled the container but cropped the portrait video
 *   from the center — cutting the head and feet.
 *
 * CANONICAL FIX:
 *   For portrait (9:16) video:
 *   - Container width is CONSTRAINED, not the video.
 *   - Container height is derived: height = width * (16/9)
 *   - object-fit: contain + forge-black background = full pilot, no crop
 *   - Video is centered within the transmission frame
 *   - HUD overlays (corner marks, scanline, REC) remain on the frame container
 *
 * MOAI: Video display is purely presentational — no state owned here.
 * SSoT: Aspect ratio constant defined once (VIDEO_ASPECT = 16/9 for portrait).
 */

import { useRef, useState, useCallback } from "react";
import './VideoTransmissionWindow.css';

// ─── SSoT ────────────────────────────────────────────────────────────────────

/** Max width of the transmission window in the lobby layout */
const TRANSMISSION_MAX_WIDTH = 520; // px — tune to your sidebar layout

// ─── Types ───────────────────────────────────────────────────────────────────

interface VideoTransmissionWindowProps {
  src:         string;
  pilotName?:  string;
  channelId?:  string;
  autoPlay?:   boolean;
  onReady?:    () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VideoTransmissionWindow({
  src,
  pilotName  = "PILOT",
  channelId  = "01",
  autoPlay   = true,
  onReady,
}: VideoTransmissionWindowProps) {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(autoPlay);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
  }, []);

  return (
    <>
      {/* Transmission window — height locked to 9:16 aspect of its width via CSS aspect-ratio */}
      <div className="tx-window">
          {/* Forge corner marks */}
          <div className="tx-corner-tl" />
          <div className="tx-corner-br" />

          {/* Scanline */}
          <div className="tx-scanline" />

          {/* Top-left HUD */}
          <div className="tx-hud-tl">
            ◈ ABYSSUM/DIESEL-CITY<br />
            SIG: NOMINAL
          </div>

          {/* Top-right HUD */}
          <div className="tx-hud-tr">
            PILOT: {pilotName}<br />
            CHANNEL {channelId}
          </div>

          {/* REC indicator */}
          <div className="tx-rec">
            <div className="tx-rec-dot" />
            REC
          </div>

          {/* ── THE VIDEO ── */}
          <video
            ref={videoRef}
            className="tx-video"
            src={src}
            autoPlay={autoPlay}
            playsInline
            loop
            muted={false}
            onCanPlay={onReady}
          />

          {/* Controls */}
          <div className="tx-controls">
            <button className="tx-play-btn" onClick={togglePlay}>
              {playing ? "▮▮ PAUSE" : "▶ PLAY"}
            </button>
            <div className="tx-progress" />
            <span className="tx-status">BROADCASTING...</span>
          </div>
        </div>
    </>
  );
}
