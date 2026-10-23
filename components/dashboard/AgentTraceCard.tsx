'use client';

import React from 'react';
import {
  Navigation,
  Compass,
  BatteryCharging,
  Share2,
  X,
  Crosshair,
  Gauge,
  Clock,
  Layers,
  Zap,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { AutonomousAgent, GeofenceZone } from '@/lib/texarkana-data';

interface AgentTraceCardProps {
  agent: AutonomousAgent;
  destinationName: string;
  etaMinutes: number;
  remainingDistanceMi: number;
  currentSpeedMph: number;
  activeGeofence: GeofenceZone | null;
  followAgent: boolean;
  speedMode: 'slow' | 'normal' | 'cruise';
  hasRerouted?: boolean;
  isRerouting?: boolean;
  onSimulateHazard?: () => void;
  onSpeedModeChange: (mode: 'slow' | 'normal' | 'cruise') => void;
  onToggleFollow: () => void;
  onStopTrace: () => void;
  onCopyShareLink: () => void;
}

export default function AgentTraceCard({
  agent,
  destinationName,
  etaMinutes,
  remainingDistanceMi,
  currentSpeedMph,
  activeGeofence,
  followAgent,
  speedMode,
  hasRerouted = false,
  isRerouting = false,
  onSimulateHazard,
  onSpeedModeChange,
  onToggleFollow,
  onStopTrace,
  onCopyShareLink,
}: AgentTraceCardProps) {
  return (
    <div className="glass-panel rounded-3xl p-5 text-gray-100 transition-all duration-300 w-full sm:w-88 pointer-events-auto border border-white/10 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase font-mono">
                Live Agent Telemetry
              </span>
              <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                {agent.callsign}
              </span>
            </div>
            <p className="text-[10px] text-gray-400">Autonomy: {agent.autonomyLevel}</p>
          </div>
        </div>
        <button
          onClick={onStopTrace}
          title="Stop Mission Trace"
          className="text-gray-400 hover:text-red-400 p-1 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Destination Target */}
      <div className="mt-3.5">
        <span className="block text-[10px] uppercase font-mono tracking-wider text-gray-400">
          Destination Target
        </span>
        <p className="font-bold text-gray-100 truncate text-sm mt-0.5 flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate">{destinationName}</span>
        </p>

        {/* Dynamic Reroute Alert Banner */}
        {isRerouting && (
          <div className="mt-2 py-1.5 px-2.5 rounded-xl bg-amber-950/80 border border-amber-500/60 flex items-center gap-2 text-amber-300 font-mono text-[10px] font-bold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>HAZARD ENCOUNTERED: AUTONOMOUS REROUTING...</span>
          </div>
        )}
        {hasRerouted && !isRerouting && (
          <div className="mt-2 py-1.5 px-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-center justify-between text-xs animate-in fade-in duration-300">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px] font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              <span>AUTONOMOUS REROUTE ACTIVE</span>
            </div>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
              Hazard Evaded
            </span>
          </div>
        )}
      </div>

      {/* Geofence Status Ribbon */}
      <div className="mt-2.5 py-1.5 px-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] text-gray-300 truncate max-w-[170px]">
            {activeGeofence ? activeGeofence.name : 'Open Texarkana Grid'}
          </span>
        </div>
        {activeGeofence ? (
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase border ${
              activeGeofence.type === 'safe'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                : activeGeofence.type === 'warning'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                : activeGeofence.type === 'restricted'
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                : 'bg-blue-500/15 text-blue-400 border-blue-500/40'
            }`}
          >
            {activeGeofence.type}
          </span>
        ) : (
          <span className="text-[9px] text-gray-400 font-mono">Clear</span>
        )}
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 mt-3 bg-black/40 p-3 rounded-2xl border border-white/5 text-center">
        <div>
          <span className="flex items-center justify-center gap-1 text-[9px] text-gray-400 uppercase font-mono">
            <Clock className="w-2.5 h-2.5" /> Est. Time
          </span>
          <span className="font-extrabold text-gray-100 text-xs mt-1 block">
            {etaMinutes > 0 ? `${etaMinutes} min` : 'Arrived'}
          </span>
        </div>
        <div className="border-x border-white/10">
          <span className="flex items-center justify-center gap-1 text-[9px] text-gray-400 uppercase font-mono">
            <Navigation className="w-2.5 h-2.5 text-blue-400" /> Dist
          </span>
          <span className="font-extrabold text-blue-400 text-xs mt-1 block">
            {remainingDistanceMi.toFixed(1)} mi
          </span>
        </div>
        <div>
          <span className="flex items-center justify-center gap-1 text-[9px] text-gray-400 uppercase font-mono">
            <Gauge className="w-2.5 h-2.5 text-emerald-400" /> Velocity
          </span>
          <span className="font-extrabold text-emerald-400 text-xs mt-1 block">
            {currentSpeedMph} mph
          </span>
        </div>
      </div>

      {/* Speed Throttle Mode Selector */}
      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
        <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
          <Zap className="w-3 h-3 text-blue-400" /> Speed Mode:
        </span>
        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/5">
          <button
            onClick={() => onSpeedModeChange('slow')}
            title="Reduced Movement Speed (14-18 mph)"
            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition ${
              speedMode === 'slow'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            Reduced (16mph)
          </button>
          <button
            onClick={() => onSpeedModeChange('normal')}
            title="Standard Movement Speed (24-28 mph)"
            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition ${
              speedMode === 'normal'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            Normal (25mph)
          </button>
          <button
            onClick={() => onSpeedModeChange('cruise')}
            title="Cruise Movement Speed (35 mph)"
            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition ${
              speedMode === 'cruise'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            Cruise
          </button>
        </div>
      </div>

      {/* Secondary Metrics: Battery & Heading */}
      <div className="flex items-center justify-between mt-2.5 px-1 text-[11px] text-gray-400">
        <div className="flex items-center gap-1.5">
          <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bat: <strong className="text-gray-200 font-mono">{agent.battery}%</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Hdg: <strong className="text-gray-200 font-mono">{agent.headingDeg}°</strong></span>
        </div>
        <div className="text-[10px] text-gray-400 font-mono">
          RSSI: <strong className="text-gray-200">{agent.signalRssi} dBm</strong>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
        <button
          onClick={onToggleFollow}
          className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
            followAgent
              ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 shadow-sm'
              : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/5'
          }`}
        >
          <Crosshair className={`w-3.5 h-3.5 ${followAgent ? 'text-blue-400 animate-spin' : ''}`} />
          <span>{followAgent ? 'Camera Locked' : 'Lock Camera'}</span>
        </button>

        <button
          onClick={onCopyShareLink}
          className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 py-2 px-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Link</span>
        </button>
      </div>

      {onSimulateHazard && (
        <button
          onClick={onSimulateHazard}
          className="w-full mt-2 py-2 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 hover:text-white font-mono text-[10px] font-bold tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-sm"
          title="Simulate encountering a hazardous zone to test automated rerouting"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span>Simulate Hazard Encounter (Auto-Reroute)</span>
        </button>
      )}
    </div>
  );
}
