
'use client';

import React, { useEffect, useState } from 'react';
import { QTEStatus } from '@/lib/game/types';
import { generateDynamicQTEPrompt } from '@/ai/flows/dynamic-qte-prompt-generation';

interface QTEOverlayProps {
  active: boolean;
  onResult: (success: boolean) => void;
}

export const QTEOverlay: React.FC<QTEOverlayProps> = ({ active, onResult }) => {
  const [qteData, setQteData] = useState<QTEStatus>({ active: false });
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (!active) {
      setQteData({ active: false });
      return;
    }

    const fetchQTE = async () => {
      try {
        const result = await generateDynamicQTEPrompt({
          interactionContext: 'initial awakening',
          mountBondLevel: 10,
          mountMood: 'agitated'
        });
        setQteData({
          active: true,
          prompt: result.qtePrompt,
          expectedKey: result.expectedKey,
          loreContext: result.loreContext
        });
        setTimer(100);
      } catch (e) {
        console.error("QTE generation failed", e);
      }
    };

    fetchQTE();
  }, [active]);

  useEffect(() => {
    if (!qteData.active) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          onResult(false);
          return 0;
        }
        return prev - 2;
      });
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === qteData.expectedKey) {
        onResult(true);
      } else {
        onResult(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [qteData, onResult]);

  if (!qteData.active) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-void/40 backdrop-blur-sm z-50">
      <div className="max-w-md w-full p-8 bg-void-dark border-2 border-ember shadow-[0_0_30px_rgba(255,140,51,0.2)] animate-in zoom-in-95 duration-200">
        <div className="text-center space-y-6">
          <div className="space-y-1">
            <span className="font-code text-[10px] text-destructive tracking-[0.2em] uppercase">Signal Detected</span>
            <h3 className="font-headline text-2xl text-ember glitch-text">{qteData.prompt}</h3>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="size-20 flex items-center justify-center border-2 border-ember rounded-full bg-ember/10 animate-pulse">
              <span className="font-headline text-3xl text-ember uppercase">{qteData.expectedKey}</span>
            </div>
            
            <div className="w-full h-1 bg-void overflow-hidden">
              <div 
                className="h-full bg-destructive transition-all duration-500 linear"
                style={{ width: `${timer}%` }}
              />
            </div>
          </div>

          <p className="font-body text-xs text-ember/60 italic leading-relaxed">
            "{qteData.loreContext}"
          </p>
        </div>
      </div>
    </div>
  );
};
