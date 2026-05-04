"use client";

/**
 * PilotDeployLobby.tsx
 * Genesis Verse — Screen 2 of 3
 *
 * VLAAD AESTHETIC DIRECTIVE (matching Screen 1):
 *   - Same forge-black atmosphere, ember particles, scanline overlay
 *   - Video player = TRANSMISSION WINDOW with HUD frame — not a media player
 *   - Resource sidebar = INDUSTRIAL PANEL with amber resource rows
 *   - CTA = forge-heat commit button, full-width, chamfered corners
 *   - Typography: Barlow Condensed (display) + JetBrains Mono (data)
 *   - Purple is gone. Navy is gone. Magenta is gone.
 *   - "Broadcast Signal" → "TRANSMISSION SIGNAL" in forge-orange
 *
 * MOAI COMPLIANCE:
 *   Resource Authority  → props.resources (caller owns, sourced from fuel-storage)
 *   Stream Authority    → props.streamQuality (sourced from portal-storage)
 *   Deploy Authority    → props.onEnterDieselCity (caller owns)
 *   Purchase Authority  → props.onBuyResource (caller owns)
 *
 * SSoT:
 *   Resource definitions: single RESOURCES array — never duplicated
 *   All color tokens: CSS variables matching Screen 1 :root
 *   Requirements thresholds: DEPLOY_REQUIREMENTS object — single definition
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── SSoT: Resource Definitions ──────────────────────────────────────────────
const RESOURCES = [
  { id: "fuel",       label: "FUEL",        icon: "◈", accent: "#ff6a00", unit: "UNITS" },
  { id: "parts",      label: "PARTS",       icon: "⬡", accent: "#f59e0b", unit: "UNITS" },
  { id: "cogs",       label: "COGS",        icon: "◉", accent: "#ff8c00", unit: "UNITS" },
  { id: "powerCores", label: "POWER CORES", icon: "◆", accent: "#ffd700", unit: "UNITS" },
] as const;

type ResourceId = typeof RESOURCES[number]["id"];

// ─── SSoT: Deploy Requirements ───────────────────────────────────────────────
const DEPLOY_REQUIREMENTS = {
  fuel: { min: 100, label: "FUEL ≥ 100 UNITS" },
  streamQuality: { required: true, label: "STREAM QUALITY LOCKED" },
} as const;

// ─── Stream Quality Labels ────────────────────────────────────────────────────
const QUALITY_LABELS: Record<string, string> = {
  low:  "LOW  · 2.8¢/MIN",
  high: "HIGH · 6.0¢/MIN",
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface ResourceAmounts {
  fuel:       number;
  parts:      number;
  cogs:       number;
  powerCores: number;
}

interface PilotDeployLobbyProps {
  heygenVideoUrl:   string;             // 30s HeyGen broadcast URL
  resources:        ResourceAmounts;    // sourced from fuel-storage (SSoT)
  streamQuality:    "low" | "high" | null; // sourced from portal-storage (SSoT)
  onEnterDieselCity: () => void;
  onBuyResource:    (id: ResourceId) => void;
  onBackToGateway:  () => void;
  pilotName?:       string;
}

// ─── Reuse ForgeAtmosphere from Screen 1 (lighter density for Screen 2) ──────
function ForgeAtmosphere({ density = 40 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const EMBER_COLORS = ["#ff6a00", "#ff4d00", "#f59e0b", "#ff8c00", "#ffd700"];
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    const particles = Array.from({ length: density }, () => ({
      x:     Math.random() * W,
      y:     H * 0.5 + Math.random() * H * 0.5,
      vy:    -(0.2 + Math.random() * 0.9),
      vx:    (Math.random() - 0.5) * 0.3,
      size:  0.5 + Math.random() * 1.8,
      alpha: 0.08 + Math.random() * 0.4,
      color: EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)],
    }));

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      for (let y = 0; y < H; y += 4) {
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        ctx.fillRect(0, y, W, 1);
      }
      particles.forEach(p => {
        p.y += p.vy; p.x += p.vx; p.alpha -= 0.0015;
        if (p.y < -10 || p.alpha <= 0) {
          p.y = H * 0.8 + Math.random() * H * 0.2;
          p.x = Math.random() * W;
          p.alpha = 0.15 + Math.random() * 0.4;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.color;
        ctx.shadowBlur  = 5;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      raf = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(raf);
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, opacity: 0.5 }}
    />
  );
}

// ─── Transmission Clock ───────────────────────────────────────────────────────
function TransmissionClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTime(`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  return <span>{time}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PilotDeployLobby({
  heygenVideoUrl,
  resources,
  streamQuality,
  onEnterDieselCity,
  onBuyResource,
  onBackToGateway,
  pilotName = "PILOT",
}: PilotDeployLobbyProps) {
  const [videoReady,   setVideoReady]   = useState(false);
  const [deployReady,  setDeployReady]  = useState(false);
  const [deploying,    setDeploying]    = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Evaluate deploy readiness — deterministic, no if/and/then chains
  useEffect(() => {
    const fuelOk    = resources.fuel >= DEPLOY_REQUIREMENTS.fuel.min;
    const qualityOk = streamQuality !== null;
    setDeployReady(fuelOk && qualityOk);
  }, [resources.fuel, streamQuality]);

  // Scan progress animation when deploy is ready
  useEffect(() => {
    if (!deployReady) { setScanProgress(0); return; }
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(p + 2, 100);
      setScanProgress(p);
      if (p >= 100) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, [deployReady]);

  const handleDeploy = useCallback(() => {
    if (!deployReady || deploying) return;
    setDeploying(true);
    setTimeout(onEnterDieselCity, 800);
  }, [deployReady, deploying, onEnterDieselCity]);

  // Hotkey: Enter = deploy when ready
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Enter" && deployReady) handleDeploy();
      if (e.key === "Escape") onBackToGateway();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [deployReady, handleDeploy, onBackToGateway]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;800;900&family=JetBrains+Mono:wght@300;400;500&display=swap');

        :root {
          --forge-black:   #06050a;
          --forge-dark:    #0d0b10;
          --forge-panel:   #110f18;
          --forge-border:  #2a2235;
          --forge-orange:  #ff6a00;
          --forge-amber:   #f59e0b;
          --forge-red:     #ff4d00;
          --forge-chrome:  #c8bfa0;
          --forge-dim:     #6b5e7a;
          --forge-text:    #e8dfc8;
          --forge-success: #22c55e;
          --forge-warn:    #ef4444;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body, html {
          background: var(--forge-black);
          color: var(--forge-text);
          font-family: 'JetBrains Mono', monospace;
          overflow: hidden;
          height: 100%;
        }

        @keyframes hud-blink {
          0%, 88%, 100% { opacity: 1; }
          94%            { opacity: 0; }
        }

        @keyframes scan-line {
          0%   { transform: translateY(-100%); opacity: 0.6; }
          100% { transform: translateY(100vh); opacity: 0; }
        }

        @keyframes panel-rise {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes deploy-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,106,0,0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(255,106,0,0); }
        }

        @keyframes forge-ignite {
          0%   { filter: brightness(1); }
          50%  { filter: brightness(1.4) saturate(1.3); }
          100% { filter: brightness(1); }
        }

        /* ── LAYOUT ── */
        .lobby-root {
          position: relative; z-index: 10;
          height: 100vh;
          display: grid;
          grid-template-rows: 48px 1fr 100px;
          grid-template-columns: 1fr 340px;
          grid-template-areas:
            "nav    nav"
            "main   sidebar"
            "deploy deploy";
          background:
            radial-gradient(ellipse 100% 50% at 50% 105%, rgba(255,106,0,0.1) 0%, transparent 55%),
            radial-gradient(ellipse 60%  30% at 10% 100%, rgba(245,158,11,0.06) 0%, transparent 50%),
            linear-gradient(180deg, #06050a 0%, #0a0812 100%);
          overflow: hidden;
        }

        /* Forge grid overlay */
        .lobby-root::before {
          content: '';
          position: fixed; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(255,106,0,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,106,0,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        /* Forge horizon */
        .lobby-root::after {
          content: '';
          position: fixed; bottom: 0; left: 0; right: 0; height: 1px; z-index: 5;
          background: linear-gradient(90deg, transparent, rgba(255,106,0,0.5), rgba(245,158,11,0.7), rgba(255,106,0,0.5), transparent);
        }

        /* ── NAV ── */
        .nav-bar {
          grid-area: nav;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 20px;
          border-bottom: 1px solid var(--forge-border);
          background: rgba(6,5,10,0.9);
          backdrop-filter: blur(8px);
          z-index: 20;
        }

        .nav-left {
          display: flex; align-items: center; gap: 12px;
          font-size: 11px; letter-spacing: 0.25em;
          color: var(--forge-chrome);
          text-transform: uppercase;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
        }

        .nav-icon {
          width: 22px; height: 22px;
          border: 1px solid var(--forge-orange);
          background: rgba(255,106,0,0.1);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; color: var(--forge-orange);
        }

        .nav-back {
          background: none; border: 1px solid var(--forge-border);
          color: var(--forge-dim);
          padding: 4px 12px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; letter-spacing: 0.2em;
          cursor: pointer; text-transform: uppercase;
          transition: all 0.15s;
        }

        .nav-back:hover {
          border-color: var(--forge-orange);
          color: var(--forge-orange);
        }

        .nav-right {
          display: flex; align-items: center; gap: 16px;
          font-size: 9px; letter-spacing: 0.2em;
          color: var(--forge-dim);
        }

        .nav-clock { color: var(--forge-amber); font-variant-numeric: tabular-nums; }

        /* ── MAIN: TRANSMISSION WINDOW ── */
        .main-area {
          grid-area: main;
          padding: 16px 16px 12px 20px;
          display: flex; flex-direction: column; gap: 10px;
          animation: panel-rise 0.5s ease 0.1s both;
          overflow: hidden;
        }

        .transmission-header {
          display: flex; align-items: center; justify-content: space-between;
        }

        .transmission-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 9px; letter-spacing: 0.35em;
          color: var(--forge-orange);
          text-transform: uppercase;
        }

        .transmission-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--forge-orange);
          box-shadow: 0 0 8px var(--forge-orange);
          animation: hud-blink 2s ease infinite;
        }

        .transmission-meta {
          font-size: 8px; letter-spacing: 0.2em;
          color: var(--forge-dim);
        }

        /* VIDEO FRAME — the HUD framing is the design */
        .video-frame {
          position: relative; flex: 1;
          border: 1px solid var(--forge-border);
          background: #000;
          overflow: hidden;
          /* chamfer top-right */
          clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%);
        }

        /* Corner accent marks */
        .video-frame::before,
        .video-frame::after {
          content: '';
          position: absolute; z-index: 3; pointer-events: none;
        }

        .video-frame::before {
          top: 0; left: 0;
          width: 20px; height: 20px;
          border-top: 1px solid var(--forge-orange);
          border-left: 1px solid var(--forge-orange);
        }

        .video-frame::after {
          bottom: 0; right: 0;
          width: 20px; height: 20px;
          border-bottom: 1px solid var(--forge-amber);
          border-right: 1px solid var(--forge-amber);
        }

        .video-el {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Scanline sweep over video */
        .video-scanline {
          position: absolute; top: 0; left: 0; right: 0;
          height: 3px; z-index: 2; pointer-events: none;
          background: linear-gradient(transparent, rgba(255,106,0,0.15), transparent);
          animation: scan-line 4s linear infinite;
        }

        /* HUD overlays on video */
        .video-hud-tl {
          position: absolute; top: 8px; left: 8px; z-index: 4;
          font-size: 8px; letter-spacing: 0.2em;
          color: rgba(255,106,0,0.7);
          pointer-events: none;
        }

        .video-hud-br {
          position: absolute; bottom: 8px; right: 8px; z-index: 4;
          font-size: 8px; letter-spacing: 0.15em;
          color: rgba(245,158,11,0.6);
          pointer-events: none;
          text-align: right;
        }

        .video-status {
          display: flex; align-items: center; gap: 6px;
          font-size: 9px; letter-spacing: 0.2em;
          color: var(--forge-dim);
          margin-top: 4px;
        }

        /* ── SIDEBAR ── */
        .sidebar {
          grid-area: sidebar;
          padding: 16px 20px 12px 12px;
          display: flex; flex-direction: column; gap: 12px;
          border-left: 1px solid var(--forge-border);
          animation: panel-rise 0.5s ease 0.2s both;
          overflow-y: auto;
        }

        .sidebar-header {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 14px; font-weight: 800;
          letter-spacing: 0.3em;
          color: var(--forge-chrome);
          text-transform: uppercase;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--forge-border);
        }

        .sidebar-sub {
          font-size: 8px; letter-spacing: 0.15em;
          color: var(--forge-dim);
          margin-top: 2px;
        }

        /* Resource rows */
        .resource-list { display: flex; flex-direction: column; gap: 6px; }

        .resource-row {
          display: flex; align-items: center;
          padding: 9px 12px;
          background: var(--forge-panel);
          border: 1px solid var(--forge-border);
          gap: 10px;
          transition: border-color 0.15s;
          clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%);
        }

        .resource-row:hover { border-color: var(--res-accent, var(--forge-orange)); }

        .resource-icon {
          font-size: 14px;
          color: var(--res-accent, var(--forge-orange));
          min-width: 16px;
          text-align: center;
        }

        .resource-info { flex: 1; min-width: 0; }

        .resource-label {
          font-size: 9px; letter-spacing: 0.2em;
          color: var(--forge-chrome);
          text-transform: uppercase;
        }

        .resource-amount {
          font-size: 13px;
          color: var(--res-accent, var(--forge-orange));
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .resource-buy {
          padding: 4px 10px;
          background: none;
          border: 1px solid var(--forge-border);
          color: var(--forge-dim);
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; letter-spacing: 0.15em;
          cursor: pointer; text-transform: uppercase;
          transition: all 0.12s;
        }

        .resource-buy:hover {
          border-color: var(--res-accent, var(--forge-orange));
          color: var(--res-accent, var(--forge-orange));
          background: rgba(255,106,0,0.05);
        }

        /* Stream quality display */
        .quality-display {
          padding: 10px 12px;
          border: 1px solid var(--forge-border);
          background: var(--forge-panel);
          display: flex; align-items: center; justify-content: space-between;
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
        }

        .quality-label {
          font-size: 8px; letter-spacing: 0.2em;
          color: var(--forge-dim);
          text-transform: uppercase;
        }

        .quality-value {
          font-size: 11px; letter-spacing: 0.1em;
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
        }

        /* Requirements check */
        .req-list { display: flex; flex-direction: column; gap: 4px; }

        .req-row {
          display: flex; align-items: center; gap: 8px;
          font-size: 9px; letter-spacing: 0.1em;
        }

        .req-icon { font-size: 10px; min-width: 12px; }
        .req-ok   { color: var(--forge-success); }
        .req-fail { color: var(--forge-warn); }

        /* ── DEPLOY ZONE ── */
        .deploy-zone {
          grid-area: deploy;
          padding: 10px 20px;
          border-top: 1px solid var(--forge-border);
          background: rgba(6,5,10,0.95);
          backdrop-filter: blur(8px);
          display: flex; flex-direction: column; gap: 8px;
          z-index: 20;
          animation: panel-rise 0.5s ease 0.3s both;
        }

        .deploy-requirements {
          display: flex; align-items: center; gap: 20px;
          padding: 0 4px;
        }

        .deploy-req-label {
          font-size: 8px; letter-spacing: 0.25em;
          color: var(--forge-dim);
          text-transform: uppercase;
          margin-right: 8px;
        }

        /* Scan progress bar */
        .scan-bar-wrap {
          height: 2px;
          background: var(--forge-border);
          overflow: hidden;
          margin: 0 -20px;
        }

        .scan-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--forge-orange), var(--forge-amber));
          box-shadow: 0 0 8px rgba(255,106,0,0.6);
          transition: width 0.05s linear;
        }

        /* THE COMMIT BUTTON */
        .deploy-btn {
          position: relative;
          width: 100%;
          padding: 16px;
          background: linear-gradient(90deg, #ff4d00, #ff6a00, #f59e0b);
          border: none;
          color: #000;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 24px; font-weight: 900;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          transition: filter 0.15s, transform 0.1s;
          clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
          overflow: hidden;
        }

        .deploy-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
        }

        .deploy-btn:hover:not(:disabled) {
          filter: brightness(1.15) saturate(1.1);
          transform: translateY(-1px);
          animation: deploy-pulse 1s ease infinite, forge-ignite 0.5s ease;
        }

        .deploy-btn:active:not(:disabled) {
          transform: translateY(1px);
          filter: brightness(0.9);
        }

        .deploy-btn:disabled {
          background: linear-gradient(90deg, #2a2235, #1a1620);
          color: var(--forge-dim);
          cursor: not-allowed;
          filter: none;
          transform: none;
        }

        .deploy-btn-icon { font-size: 20px; }

        .deploy-btn-sub {
          position: absolute; bottom: 3px; right: 20px;
          font-size: 8px; letter-spacing: 0.2em;
          color: rgba(0,0,0,0.5);
          font-family: 'JetBrains Mono', monospace;
          font-weight: 400;
        }

        .deploy-btn-sub-dim {
          position: absolute; bottom: 3px; right: 20px;
          font-size: 8px; letter-spacing: 0.2em;
          color: var(--forge-dim);
          font-family: 'JetBrains Mono', monospace;
        }

        /* ── Scrollbar ── */
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-track { background: var(--forge-black); }
        .sidebar::-webkit-scrollbar-thumb { background: var(--forge-border); }
      `}</style>

      <ForgeAtmosphere density={30} />

      <div className="lobby-root">

        {/* ── NAV ── */}
        <nav className="nav-bar">
          <div className="nav-left">
            <div className="nav-icon">⚔</div>
            DIESEL CITY 3D · PILOT DEPLOY LOBBY
          </div>

          <div className="nav-right">
            <span className="nav-clock"><TransmissionClock /></span>
            <span style={{ color: "var(--forge-border)" }}>|</span>
            <button className="nav-back" onClick={onBackToGateway}>
              ← BACK TO GATEWAY  [ ESC ]
            </button>
          </div>
        </nav>

        {/* ── MAIN: TRANSMISSION WINDOW ── */}
        <main className="main-area">
          <div className="transmission-header">
            <div className="transmission-label">
              <div className="transmission-dot" />
              TRANSMISSION SIGNAL · DIESEL CITY BROADCAST
            </div>
            <div className="transmission-meta">
              PILOT: {pilotName} · CHANNEL 01
            </div>
          </div>

          {/* Video — the HUD frame is the differentiator */}
          <div className="video-frame">
            <div className="video-scanline" />
            <div className="video-hud-tl">
              ◈ ABYSSUM/DIESEL-CITY<br />
              SIG: NOMINAL
            </div>
            <div className="video-hud-br">
              REC ●<br />
              30.0s
            </div>
            <video
              ref={videoRef}
              className="video-el"
              src={heygenVideoUrl}
              autoPlay
              muted={false}
              controls={false}
              playsInline
              onCanPlay={() => setVideoReady(true)}
              loop
            />
            {/* Custom minimal controls */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "8px 12px",
              background: "linear-gradient(transparent, rgba(6,5,10,0.8))",
              display: "flex", alignItems: "center", gap: 8, zIndex: 4,
            }}>
              <button
                style={{
                  background: "none", border: "none",
                  color: "var(--forge-orange)", cursor: "pointer",
                  fontSize: 10, letterSpacing: "0.2em",
                  fontFamily: "JetBrains Mono, monospace",
                }}
                onClick={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  v.paused ? v.play() : v.pause();
                }}
              >
                ▶ PLAY / PAUSE
              </button>
              <div style={{
                flex: 1, height: 1,
                background: "linear-gradient(90deg, var(--forge-orange), transparent)",
                opacity: 0.4,
              }} />
              <span style={{ fontSize: 8, letterSpacing: "0.2em", color: "var(--forge-dim)" }}>
                BROADCASTING...
              </span>
            </div>
          </div>

        </main>

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div>
            <div className="sidebar-header">
              ◈ RESOURCE INVENTORY
            </div>
            <div className="sidebar-sub">TRACK B · FIELD SUPPLY CHAIN</div>
          </div>

          <div className="resource-list">
            {RESOURCES.map(r => (
              <div
                key={r.id}
                className="resource-row"
                style={{ "--res-accent": r.accent } as React.CSSProperties}
              >
                <div className="resource-icon">{r.icon}</div>
                <div className="resource-info">
                  <div className="resource-label">{r.label}</div>
                  <div className="resource-amount">
                    {resources[r.id].toLocaleString()}
                    <span style={{ fontSize: 8, opacity: 0.5, marginLeft: 4 }}>{r.unit}</span>
                  </div>
                </div>
                <button
                  className="resource-buy"
                  onClick={() => onBuyResource(r.id)}
                >
                  BUY
                </button>
              </div>
            ))}
          </div>

          {/* Stream Quality */}
          <div className="quality-display">
            <div>
              <div className="quality-label">STREAM QUALITY</div>
              <div
                className="quality-value"
                style={{
                  color: streamQuality ? "var(--forge-orange)" : "var(--forge-dim)",
                }}
              >
                {streamQuality ? QUALITY_LABELS[streamQuality] : "— NOT SET —"}
              </div>
            </div>
            <span style={{ fontSize: 14, color: streamQuality ? "var(--forge-orange)" : "var(--forge-warn)" }}>
              {streamQuality ? "◈" : "◇"}
            </span>
          </div>

          {/* Requirements */}
          <div>
            <div style={{
              fontSize: 8, letterSpacing: "0.25em",
              color: "var(--forge-dim)", marginBottom: 6,
              textTransform: "uppercase",
            }}>
              DEPLOY REQUIREMENTS
            </div>
            <div className="req-list">
              <div className={`req-row ${resources.fuel >= 100 ? "req-ok" : "req-fail"}`}>
                <span className="req-icon">{resources.fuel >= 100 ? "✓" : "✗"}</span>
                FUEL ≥ 100  ·  CURRENT: {resources.fuel}
              </div>
              <div className={`req-row ${streamQuality ? "req-ok" : "req-fail"}`}>
                <span className="req-icon">{streamQuality ? "✓" : "✗"}</span>
                STREAM QUALITY LOCKED
              </div>
            </div>
          </div>
        </aside>

        {/* ── DEPLOY ZONE ── */}
        <div className="deploy-zone">
          {/* Scan bar */}
          <div className="scan-bar-wrap">
            <div
              className="scan-bar-fill"
              style={{ width: `${scanProgress}%` }}
            />
          </div>

          <button
            className="deploy-btn"
            onClick={handleDeploy}
            disabled={!deployReady || deploying}
          >
            <span className="deploy-btn-icon">
              {deploying ? "◉" : "⚔"}
            </span>
            {deploying
              ? "ENTERING DIESEL CITY..."
              : deployReady
                ? "ENTER DIESEL CITY 3D"
                : "AWAITING CLEARANCE"
            }
            {deployReady && !deploying && (
              <span className="deploy-btn-sub">PRESS ENTER TO DEPLOY</span>
            )}
            {!deployReady && (
              <span className="deploy-btn-sub-dim">MEET REQUIREMENTS TO UNLOCK</span>
            )}
          </button>
        </div>

      </div>
    </>
  );
}
