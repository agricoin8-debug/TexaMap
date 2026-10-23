'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  Check,
  MapPin,
  LocateFixed,
  ChevronDown,
  ChevronUp,
  Layers,
  BatteryCharging,
  Navigation,
  Bot,
  Gauge,
  Radio,
  Car,
  Plane
} from 'lucide-react';
import { AutonomousAgent } from '@/lib/texarkana-data';

interface FleetSummaryPanelProps {
  fleet: AutonomousAgent[];
  activeAgentId: string;
  onSelectAgent: (agentId: string) => void;
  onLocateAgent: (coords: [number, number], agentName: string) => void;
  onStartAgentTrace?: (agent: AutonomousAgent) => void;
}

export default function FleetSummaryPanel({
  fleet,
  activeAgentId,
  onSelectAgent,
  onLocateAgent,
  onStartAgentTrace,
}: FleetSummaryPanelProps) {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Status icon helper using Lucide icons as requested:
  // 'Play' for active/en_route, 'Pause' for idle, 'Check' for completed tasks
  const renderStatusBadge = (status: AutonomousAgent['status']) => {
    switch (status) {
      case 'en_route':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
            <Play className="w-3 h-3 fill-emerald-400 text-emerald-400 animate-pulse" />
            <span>Active</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 text-[10px] font-mono font-bold">
            <Check className="w-3 h-3 text-cyan-400 stroke-[3]" />
            <span>Completed</span>
          </span>
        );
      case 'idle':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold">
            <Pause className="w-3 h-3 fill-amber-300 text-amber-300" />
            <span>Idle</span>
          </span>
        );
    }
  };

  const getVehicleIcon = (type: AutonomousAgent['type']) => {
    switch (type) {
      case 'surveillance_drone':
        return <Plane className="w-3.5 h-3.5 text-purple-400" />;
      case 'transit_shuttle':
        return <Car className="w-3.5 h-3.5 text-emerald-400" />;
      case 'ground_rover':
      default:
        return <Radio className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl p-4 text-gray-100 transition-all duration-300 w-full md:w-[480px] pointer-events-auto">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-white/10"
        onClick={() => setIsMinimized((prev) => !prev)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold font-mono tracking-wider text-gray-100 uppercase">
                Fleet Status & Destination Matrix
              </h3>
              <span className="text-[9px] bg-blue-500/20 border border-blue-500/40 text-blue-300 px-2 py-0.5 rounded-full font-mono font-semibold">
                {fleet.length} Units
              </span>
            </div>
            <p className="text-[10px] text-gray-400">Continuous bi-state telemetry synchronization</p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized((prev) => !prev);
          }}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          title={isMinimized ? 'Expand Fleet Summary' : 'Minimize Fleet Summary'}
        >
          {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Summary Table Content */}
      {!isMinimized && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[9px] uppercase font-mono tracking-wider text-gray-400">
                <th className="pb-2 font-semibold">Agent / Call</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 font-semibold">Assigned Destination</th>
                <th className="pb-2 font-semibold text-center">Telemetry</th>
                <th className="pb-2 font-semibold text-right">Locate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {fleet.map((agent) => {
                const isActive = agent.id === activeAgentId;
                return (
                  <tr
                    key={agent.id}
                    onClick={() => onSelectAgent(agent.id)}
                    className={`group cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-blue-600/15 text-white'
                        : 'hover:bg-white/5 text-gray-300'
                    }`}
                  >
                    {/* Agent Call & Type */}
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: agent.avatarColor }}
                        />
                        <div>
                          <div className="flex items-center gap-1 font-bold text-xs text-gray-100 font-mono">
                            {getVehicleIcon(agent.type)}
                            <span>{agent.callsign}</span>
                          </div>
                          <p className="text-[9px] text-gray-400 truncate max-w-[95px]">{agent.name}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status with requested icons (Play, Pause, Check) */}
                    <td className="py-2.5 pr-2 whitespace-nowrap">
                      {renderStatusBadge(agent.status)}
                    </td>

                    {/* Assigned Destination with MapPin Location Icon */}
                    <td className="py-2.5 pr-2 max-w-[140px]">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] font-medium text-gray-200 truncate leading-snug" title={agent.assignedDestination || 'Downtown Core'}>
                          {agent.assignedDestination || 'Downtown Core'}
                        </span>
                      </div>
                    </td>

                    {/* Telemetry quick glance (Bat & Speed) */}
                    <td className="py-2.5 pr-2 text-center whitespace-nowrap font-mono text-[10px]">
                      <div className="flex flex-col items-center">
                        <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                          <Gauge className="w-2.5 h-2.5 text-emerald-400" />
                          {agent.speedMph} mph
                        </span>
                        <span className="text-gray-400 flex items-center gap-0.5">
                          <BatteryCharging className="w-2.5 h-2.5 text-gray-400" />
                          {agent.battery}%
                        </span>
                      </div>
                    </td>

                    {/* Locate Icon Action Button */}
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAgent(agent.id);
                          onLocateAgent(agent.currentCoords, agent.name);
                        }}
                        className="p-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-600 border border-blue-500/30 text-blue-300 hover:text-white transition shadow-sm inline-flex items-center justify-center"
                        title={`Locate ${agent.name} on map`}
                      >
                        <LocateFixed className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Quick Info Footer */}
          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Navigation className="w-3 h-3 text-blue-400" /> Click any agent to focus telemetry
            </span>
            <span>Texarkana Metro Grid</span>
          </div>
        </div>
      )}
    </div>
  );
}
