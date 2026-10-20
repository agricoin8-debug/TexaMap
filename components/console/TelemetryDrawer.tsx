'use client';

import React, { useState } from 'react';
import {
  Terminal,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  AlertTriangle,
  RotateCcw,
  Sliders
} from 'lucide-react';

export interface TelemetryLog {
  id: string;
  timestamp: string;
  tag: 'BACKEND_INIT' | 'GEOPROCESSOR' | 'GEOFENCE' | 'VELOCITY_PID' | 'AI_MISSION' | 'TELEMETRY' | 'ALERT' | 'SYSTEM';
  message: string;
  data?: any;
}

interface TelemetryDrawerProps {
  logs: TelemetryLog[];
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  onInjectObstacle: () => void;
  onEmergencyRTH: () => void;
  streamRateHz: number;
  packetCount: number;
  latencyMs: number;
}

export default function TelemetryDrawer({
  logs,
  isOpen,
  onToggle,
  onClear,
  onInjectObstacle,
  onEmergencyRTH,
  streamRateHz,
  packetCount,
  latencyMs,
}: TelemetryDrawerProps) {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'GEOFENCE') return log.tag === 'GEOFENCE';
    if (activeFilter === 'GEOPROCESSOR') return log.tag === 'GEOPROCESSOR';
    if (activeFilter === 'AI_MISSION') return log.tag === 'AI_MISSION';
    if (activeFilter === 'ALERT') return log.tag === 'ALERT';
    return true;
  });

  const exportLogsAsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `texarkana_telemetry_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getTagColor = (tag: TelemetryLog['tag']) => {
    switch (tag) {
      case 'BACKEND_INIT':
        return 'text-blue-400 bg-blue-950/60 border-blue-800';
      case 'GEOPROCESSOR':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
      case 'GEOFENCE':
        return 'text-amber-400 bg-amber-950/60 border-amber-800';
      case 'VELOCITY_PID':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800';
      case 'AI_MISSION':
        return 'text-purple-400 bg-purple-950/60 border-purple-800';
      case 'ALERT':
        return 'text-rose-400 bg-rose-950/60 border-rose-800';
      default:
        return 'text-gray-400 bg-slate-900 border-slate-700';
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 bg-[#070a12]/95 backdrop-blur-2xl border-t border-emerald-500/20 shadow-2xl transition-transform duration-300 font-mono text-xs ${
        isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-44px)]'
      }`}
    >
      {/* Drawer Bar Header */}
      <div
        className="bg-black/40 px-5 py-2.5 flex items-center justify-between border-b border-white/10 cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-gray-200 text-xs tracking-wider">
              BACKEND AGENT KERNEL & TELEMETRY STREAM
            </span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              ACTIVE
            </span>
          </div>

          {/* Quick Metrics Bar in Header */}
          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/10 text-[11px] text-gray-400">
            <span>Rate: <strong className="text-emerald-400">{streamRateHz} Hz</strong></span>
            <span>Packets: <strong className="text-blue-400">{packetCount}</strong></span>
            <span>Latency: <strong className="text-amber-400">{latencyMs} ms</strong></span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onInjectObstacle}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 rounded-xl text-[11px] transition"
            title="Inject simulated road obstacle/reroute event"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Simulate Incident</span>
          </button>

          <button
            onClick={onEmergencyRTH}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 rounded-xl text-[11px] transition"
            title="Trigger Return To Home"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Emergency RTH</span>
          </button>

          <button
            onClick={exportLogsAsJson}
            className="text-gray-400 hover:text-gray-200 p-1.5 rounded-lg transition"
            title="Download Telemetry JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClear}
            className="text-gray-400 hover:text-gray-200 p-1.5 rounded-lg transition"
            title="Clear Stream Buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg transition"
            title={isOpen ? 'Collapse' : 'Expand'}
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      {isOpen && (
        <div className="px-5 py-2 bg-black/30 border-b border-white/5 flex items-center justify-between overflow-x-auto text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 mr-1 flex items-center gap-1">
              <Sliders className="w-3 h-3" /> Filter:
            </span>
            {['ALL', 'GEOPROCESSOR', 'GEOFENCE', 'AI_MISSION', 'ALERT'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 py-0.5 rounded-lg transition ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-white/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="text-[10px] text-gray-500 font-mono">
            Showing {filteredLogs.length} events
          </div>
        </div>
      )}

      {/* Log Feed */}
      {isOpen && (
        <div className="p-4 overflow-y-auto space-y-1.5 h-56 text-[11px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 text-emerald-400/90">
          {filteredLogs.length === 0 ? (
            <div className="text-gray-600 text-center py-8 italic">
              No telemetry packets matching current filter.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 hover:bg-white/5 p-1 rounded-lg transition">
                <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
                <span className={`px-1.5 py-0.2 rounded border text-[10px] font-semibold shrink-0 ${getTagColor(log.tag)}`}>
                  [{log.tag}]
                </span>
                <span className="text-gray-300 break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
