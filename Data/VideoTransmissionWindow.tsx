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

import { useRef, useState, useEffect, useCallback } from "react";

// ─── SSoT ────────────────────────────────────────────────────────────────────

/** Portrait 9:16 = height is 16/9 × width */
const VIDEO_ASPECT_H_OVER_W = 16 / 9;

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
  const containerRef    = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [containerW, setContainerW] = useState(TRANSMISSION_MAX_WIDTH);

  // Measure container width for dynamic height calculation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerW(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── THE FIX: height derived from width at 9:16 ──
  // If container is 360px wide → height = 360 × (16/9) = 640px
  // Full pilot visible, no head/feet clipping.
  const frameHeight = Math.round(containerW * VIDEO_ASPECT_H_OVER_W);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
  }, []);

  return (
    <>
      <style>{`
        @keyframes scanline-sweep {
          0%   { transform: translateY(-8px); opacity: 0.5; }
          100% { transform: translateY(100%); opacity: 0; }
        }

        @keyframes rec-blink {
          0%, 80%, 100% { opacity: 1; }
          90%            { opacity: 0; }
        }

        .tx-window {
          position: relative;
          width: 100%;
          max-width: ${TRANSMISSION_MAX_WIDTH}px;
          /* ── PORTRAIT FIX: height = width × (16/9) ── */
          background: #000;
          border: 1px solid #2a2235;
          overflow: hidden;
          /* chamfer top-right corner */
          clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%);
          flex-shrink: 0;
        }

        /* Corner forge marks */
        .tx-corner-tl {
          position: absolute; top: 0; left: 0; z-index: 4;
          width: 20px; height: 20px;
          border-top: 1px solid #ff6a00;
          border-left: 1px solid #ff6a00;
          pointer-events: none;
        }

        .tx-corner-br {
          position: absolute; bottom: 0; right: 0; z-index: 4;
          width: 20px; height: 20px;
          border-bottom: 1px solid #f59e0b;
          border-right: 1px solid #f59e0b;
          pointer-events: none;
        }

        /* Scanline sweep */
        .tx-scanline {
          position: absolute; top: 0; left: 0; right: 0;
          height: 4px; z-index: 3; pointer-events: none;
          background: linear-gradient(transparent, rgba(255,106,0,0.18), transparent);
          animation: scanline-sweep 3.5s linear infinite;
        }

        /* HUD overlays */
        .tx-hud-tl {
          position: absolute; top: 10px; left: 10px; z-index: 5;
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px; letter-spacing: 0.2em;
          color: rgba(255,106,0,0.75);
          pointer-events: none;
          line-height: 1.6;
        }

        .tx-hud-tr {
          position: absolute; top: 10px; right: 10px; z-index: 5;
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px; letter-spacing: 0.15em;
          color: rgba(200,191,160,0.6);
          pointer-events: none;
          text-align: right;
          line-height: 1.6;
        }

        /* REC indicator */
        .tx-rec {
          position: absolute; bottom: 42px; right: 10px; z-index: 5;
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px; letter-spacing: 0.2em;
          color: rgba(255,106,0,0.8);
          pointer-events: none;
          display: flex; align-items: center; gap: 5px;
        }

        .tx-rec-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #ff4d00;
          box-shadow: 0 0 6px #ff4d00;
          animation: rec-blink 2s ease infinite;
        }

        /* ── THE VIDEO ELEMENT ── */
        .tx-video {
          display: block;
          width: 100%;
          height: 100%;
          /*
           * object-fit: CONTAIN — full portrait video visible, no cropping.
           * Background black fills any letterbox areas.
           * DO NOT use object-fit: cover for portrait video in a landscape container.
           */
          object-fit: contain;
          background: #000;
        }

        /* Bottom control strip */
        .tx-controls {
          position: absolute; bottom: 0; left: 0; right: 0; z-index: 5;
          padding: 6px 12px;
          background: linear-gradient(transparent, rgba(6,5,10,0.85));
          display: flex; align-items: center; gap: 10px;
        }

        .tx-play-btn {
          background: none; border: none;
          color: #ff6a00; cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 2px 0;
          transition: color 0.1s;
        }

        .tx-play-btn:hover { color: #f59e0b; }

        .tx-progress {
          flex: 1; height: 1px;
          background: linear-gradient(90deg, #ff6a00, transparent);
          opacity: 0.35;
        }

        .tx-status {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px; letter-spacing: 0.15em;
          color: rgba(107,94,122,0.8);
        }
      `}</style>

      {/* Outer ref div measures available width */}
      <div ref={containerRef} style={{ width: "100%" }}>
        {/* Transmission window — height locked to 9:16 aspect of its width */}
        <div
          className="tx-window"
          style={{ height: `${frameHeight}px` }}
        >
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
            style={{ height: `${frameHeight}px` }}
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
      </div>
    </>
  );
}
