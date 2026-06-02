'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const BOOT_LINES = [
  { text: 'CORE SYNC CONNECTING... [NODE ACTIVE]',      delay: 0    },
  { text: 'MANIFEST VALIDATED... KIT: DPK',             delay: 800  },
  { text: 'FREIGHT LOADER INITIALIZING...',             delay: 1600 },
  { text: 'BABYLON ENGINE v7.54.3 — WEBGL2 CONFIRMED', delay: 2400 },
  { text: 'ASSET PROXY /api/asset/ — STREAMING',        delay: 3200 },
  { text: 'FORGE NET: CONNECTED',                       delay: 4000 },
  { text: 'CALIBRATING SYNC...',                        delay: 4800 },
  { text: '▓▓▓▓▓▓▓▓▓▓ GRID ENTRY AUTHORIZED',          delay: 6200 },
];

export default function GridEntryPage() {
  const router = useRouter();
  const [visible, setVisible] = useState<number[]>([]);
  const [angle, setAngle] = useState<number>(0);
  const rafRef = useRef<number>(0);

  const addVisible = useCallback((i: number) => {
    setVisible(prev => [...prev, i]);
  }, []);

  useEffect(() => {
    let a = 0;
    const spin = () => {
      a += 1.5;
      setAngle(a);
      rafRef.current = requestAnimationFrame(spin);
    };
    rafRef.current = requestAnimationFrame(spin);

    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => addVisible(i), line.delay);
    });

    const nav = setTimeout(() => {
      cancelAnimationFrame(rafRef.current);
      router.push('/forge');
    }, 7800);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(nav);
    };
  }, [router, addVisible]);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="120" height="120" viewBox="0 0 120 120"
        style={{ transform: `rotate(${angle}deg)`, marginBottom: 48 }}>
        <circle cx="60" cy="60" r="50" fill="none"
          stroke="#c2410c" strokeWidth="3"
          strokeDasharray="200 115" strokeLinecap="round" />
      </svg>

      <p style={{
        color: '#fff', fontFamily: 'monospace',
        fontSize: 'clamp(0.8rem, 2.5vw, 1.2rem)',
        letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 32,
      }}>
        Preparing for Grid Entry
      </p>

      <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.15em' }}>
        {BOOT_LINES.map((line, i) => (
          <p key={i} style={{
            margin: '3px 0',
            color: i === BOOT_LINES.length - 1 ? '#20d9b4' : '#c2410c',
            opacity: visible.includes(i) ? 1 : 0,
            transition: 'opacity 0.4s',
          }}>
            {line.text}
          </p>
        ))}
      </div>
    </div>
  );
}