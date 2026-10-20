'use client';

import React from 'react';
import { Camera, Square, SkipForward, Landmark } from 'lucide-react';

export interface TourStep {
  name: string;
  coords: [number, number];
  zoom: number;
  durationSec: number;
  description: string;
  historicalNote: string;
}

export const TEXARKANA_TOUR_STEPS: TourStep[] = [
  {
    name: 'State Line Post Office & Federal Courthouse',
    coords: [33.4253, -94.0430],
    zoom: 16,
    durationSec: 6,
    description: 'Straddling the exact state line dividing Texas and Arkansas.',
    historicalNote: 'The only federal building in the United States situated on a state border.'
  },
  {
    name: 'Historic Perot Theatre Arts District',
    coords: [33.4222, -94.0433],
    zoom: 16,
    durationSec: 5,
    description: 'Restored 1924 Italian Renaissance theatre in Downtown Texarkana.',
    historicalNote: 'Renowned landmark hosting national symphonies and theatrical touring companies.'
  },
  {
    name: 'Texas A&M University - Texarkana',
    coords: [33.4735, -94.1165],
    zoom: 15,
    durationSec: 6,
    description: 'Dynamic university campus supporting autonomous vehicle research testbeds.',
    historicalNote: 'A premier educational institution in the Ark-La-Tex quadripoint region.'
  },
  {
    name: 'Spring Lake Park Environmental Sanctuary',
    coords: [33.4601, -94.0674],
    zoom: 15,
    durationSec: 5,
    description: '145-acre natural lake reserve with walking trails and wildlife corridors.',
    historicalNote: 'Designated low-speed quiet corridor for automated ecological rovers.'
  },
  {
    name: 'Wright Patman Lake Reservoir',
    coords: [33.2970, -94.1685],
    zoom: 13,
    durationSec: 7,
    description: 'Expansive regional reservoir formed by the dam on the Sulphur River.',
    historicalNote: 'Vital water resource providing long-range autonomous drone flight paths.'
  }
];

interface TourControllerProps {
  isTourActive: boolean;
  currentStepIndex: number;
  onStartTour: () => void;
  onStopTour: () => void;
  onNextStep: () => void;
}

export default function TourController({
  isTourActive,
  currentStepIndex,
  onStartTour,
  onStopTour,
  onNextStep,
}: TourControllerProps) {
  const currentStep = TEXARKANA_TOUR_STEPS[currentStepIndex];

  if (!isTourActive) {
    return (
      <button
        onClick={onStartTour}
        className="pointer-events-auto whitespace-nowrap px-3.5 py-1.5 glass-panel text-xs font-medium rounded-xl hover:bg-white/10 text-gray-200 transition flex items-center gap-2"
        title="Start Automated Pan/Zoom Tour of Texarkana"
      >
        <Camera className="w-3.5 h-3.5 text-blue-400" />
        <span className="hidden sm:inline">Automated Tour</span>
        <span className="sm:hidden">Tour</span>
      </button>
    );
  }

  return (
    <div className="pointer-events-auto glass-panel rounded-3xl border border-blue-500/40 shadow-2xl p-4 text-gray-100 w-80 animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
          <span className="text-[11px] font-bold tracking-wider text-blue-400 uppercase font-mono">
            Aerial Tour ({currentStepIndex + 1}/{TEXARKANA_TOUR_STEPS.length})
          </span>
        </div>
        <button
          onClick={onStopTour}
          className="text-gray-400 hover:text-red-400 transition p-1"
          title="Stop Tour"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>

      <div className="mt-3">
        <h4 className="font-bold text-xs text-gray-100 flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{currentStep.name}</span>
        </h4>
        <p className="text-[11px] text-gray-300 mt-1 leading-snug">{currentStep.description}</p>
        <p className="text-[10px] text-gray-400 italic mt-1.5 bg-black/40 p-2 rounded-xl border border-white/5">
          💡 {currentStep.historicalNote}
        </p>
      </div>

      <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-white/10">
        <div className="flex gap-1">
          {TEXARKANA_TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStepIndex
                  ? 'w-5 bg-blue-500'
                  : idx < currentStepIndex
                  ? 'w-2 bg-gray-500'
                  : 'w-2 bg-gray-800'
              }`}
            />
          ))}
        </div>

        <button
          onClick={onNextStep}
          className="text-[11px] bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-xl font-semibold flex items-center gap-1.5 transition"
        >
          <span>Next Stop</span>
          <SkipForward className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
