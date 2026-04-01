
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface LandingScreenProps {
  onLaunch: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onLaunch }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-void/60 backdrop-blur-[2px]">
      <div className="max-w-2xl w-full px-6 text-center space-y-12">
        <div className="space-y-4">
          <h1 className="font-headline text-6xl md:text-8xl text-ember tracking-tighter uppercase leading-none glitch-text">
            Arenas of Echelon
          </h1>
          <p className="font-body text-lg text-ember/80 tracking-widest uppercase animate-in fade-in slide-in-from-top-4 duration-1000 delay-500">
            Abyssum VIP – Proto v5.3
          </p>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-ember rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <Button 
            onClick={onLaunch}
            className="relative w-full py-8 text-2xl font-headline tracking-widest bg-void border-2 border-ember text-ember hover:bg-ember hover:text-void transition-all duration-300 rounded-none overflow-hidden group"
          >
            <span className="z-10 flex items-center gap-4">
              Enter Abyssum Gateway
              <ChevronRight className="size-6 group-hover:translate-x-2 transition-transform" />
            </span>
          </Button>
        </div>

        <div className="flex justify-center gap-12 pt-8 border-t border-ember/10">
          <div className="text-center space-y-1">
            <p className="font-code text-[10px] text-ember/40 uppercase">Phase Control</p>
            <p className="font-body text-xs text-ember/80">Drift Sentry Active</p>
          </div>
          <div className="text-center space-y-1">
            <p className="font-code text-[10px] text-ember/40 uppercase">Asset Forge</p>
            <p className="font-body text-xs text-ember/80">Tripo3D Connected</p>
          </div>
          <div className="text-center space-y-1">
            <p className="font-code text-[10px] text-ember/40 uppercase">Aesthetic</p>
            <p className="font-body text-xs text-ember/80">VLAAD Gothic</p>
          </div>
        </div>
      </div>
    </div>
  );
};
