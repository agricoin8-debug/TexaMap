'use client';

import React, { useState } from 'react';
import {
  X,
  MapPin,
  Building2,
  GraduationCap,
  Trees,
  Waves,
  Sparkles,
  Plane,
  Tent,
  Bot,
  ArrowRight,
  Compass,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { PRESET_LANDMARKS } from '@/lib/texarkana-data';

interface DestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDestination: (name: string, coords: [number, number], aiPlan?: any, originName?: string, arrivalAt?: string) => void;
  activeAgentName: string;
}

export default function DestinationModal({
  isOpen,
  onClose,
  onConfirmDestination,
  activeAgentName,
}: DestinationModalProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'ai_agent' | 'custom'>('presets');
  const [selectedKey, setSelectedKey] = useState<string>('courtHouse');
  const [customInput, setCustomInput] = useState<string>('');
  const [originInput, setOriginInput] = useState<string>('Downtown Texarkana');
  const [arrivalAt, setArrivalAt] = useState<string>(() => {
    const next = new Date(Date.now() + 60_000);
    next.setSeconds(0, 0);
    return next.toISOString().slice(0, 16);
  });

  // AI Mission Prompt state
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (key: string) => {
    setSelectedKey(key);
    const landmark = PRESET_LANDMARKS[key];
    if (landmark) {
      setCustomInput(landmark.name);
    }
  };

  const handleConfirmPresetOrCustom = () => {
    if (activeTab === 'presets' || activeTab === 'custom') {
      const landmark = PRESET_LANDMARKS[selectedKey];
      if (customInput && customInput !== landmark?.name) {
        const randOffsetLat = (Math.random() - 0.5) * 0.06;
        const randOffsetLng = (Math.random() - 0.5) * 0.06;
        onConfirmDestination(
          customInput,
          [Number((33.4251 + randOffsetLat).toFixed(5)), Number((-94.0477 + randOffsetLng).toFixed(5))],
          undefined,
          originInput,
          new Date(arrivalAt).toISOString()
        );
      } else if (landmark) {
        onConfirmDestination(landmark.name, landmark.coords, undefined, originInput, new Date(arrivalAt).toISOString());
      }
      onClose();
    }
  };

  const handleAiDispatch = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/agent/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          destinationName: customInput || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.mission) {
        const dest = data.mission.targetDestination || 'AI Target';
        const coords = data.mission.destinationCoords || PRESET_LANDMARKS.courtHouse.coords;
        onConfirmDestination(dest, coords, data.mission);
        onClose();
      } else {
        throw new Error(data.error || 'Failed to dispatch mission');
      }
    } catch (err: any) {
      setAiError(err.message || 'Error communicating with autonomous agent engine');
    } finally {
      setIsAiLoading(false);
    }
  };

  const getLandmarkIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2':
        return <Building2 className="w-4 h-4 text-blue-400" />;
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4 text-indigo-400" />;
      case 'Trees':
        return <Trees className="w-4 h-4 text-emerald-400" />;
      case 'Waves':
        return <Waves className="w-4 h-4 text-cyan-400" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'Plane':
        return <Plane className="w-4 h-4 text-sky-400" />;
      case 'Tent':
        return <Tent className="w-4 h-4 text-orange-400" />;
      default:
        return <MapPin className="w-4 h-4 text-red-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col text-gray-100 max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-100">Configure Route Destination</h3>
              <p className="text-xs text-gray-400">Initialize autonomous agent trace in Texarkana ({activeAgentName})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-xl hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 bg-black/30 p-2 gap-1.5 text-xs">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Regional Landmarks</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_agent')}
            className={`flex-1 py-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
              activeTab === 'ai_agent'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Commander</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <span>Custom Query</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] uppercase font-mono font-bold text-gray-400">
              Start location
              <input value={originInput} onChange={(e) => setOriginInput(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs normal-case font-sans text-gray-100 outline-none focus:border-blue-500" placeholder="Current location or address" />
            </label>
            <label className="text-[10px] uppercase font-mono font-bold text-gray-400">
              Arrive exactly at
              <input type="datetime-local" value={arrivalAt} onChange={(e) => setArrivalAt(e.target.value)} min={new Date().toISOString().slice(0, 16)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs normal-case font-sans text-gray-100 outline-none focus:border-blue-500" />
            </label>
          </div>

          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <label className="block text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                Select Texarkana Landmark Target
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar pr-1">
                {Object.entries(PRESET_LANDMARKS).map(([key, landmark]) => {
                  const isSelected = selectedKey === key;
                  return (
                    <div
                      key={key}
                      onClick={() => handleSelectPreset(key)}
                      className={`p-3 rounded-2xl cursor-pointer transition border flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500/70 text-gray-100 ring-2 ring-blue-500/30'
                          : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0">
                          {getLandmarkIcon(landmark.iconName)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-100">{landmark.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{landmark.address}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{landmark.description}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 ml-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: AI COMMANDER */}
          {activeTab === 'ai_agent' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-300 font-bold">
                  <Bot className="w-4 h-4" />
                  <span>Autonomous Tactical Mission Dispatcher</span>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Describe high-level mission parameters in natural language. Gemini AI analyzes Texarkana geography, bi-state corridors, and weather constraints to compute autonomous waypoints.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  MISSION BRIEF / TACTICAL ORDER
                </label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Inspect the Texas/Arkansas State Line corridor and proceed to Spring Lake Park while avoiding airport restricted airspace."
                  className="w-full bg-black/50 border border-white/10 rounded-2xl p-3 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none font-medium"
                />
              </div>

              {/* Sample Quick Prompts */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-gray-400 uppercase font-semibold">Suggested Directives:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Emergency payload delivery to TAMUT campus',
                    'Bi-state perimeter survey along State Line Ave',
                    'Waterway drone surveillance at Wright Patman Lake',
                    'Low-noise evening transit to Perot Theatre'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAiPrompt(preset)}
                      className="text-[10px] px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {aiError && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM */}
          {activeTab === 'custom' && (
            <div className="space-y-3">
              <label className="block text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                ENTER CUSTOM DESTINATION OR ADDRESS
              </label>
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="e.g. 500 N State Line Ave or Richmond Rd & I-30"
                className="w-full bg-black/50 border border-blue-500/40 ring-2 ring-blue-500/20 rounded-2xl px-4 py-3 text-xs text-gray-100 placeholder-gray-500 focus:outline-none font-medium"
              />
              <p className="text-[11px] text-gray-400">
                You can also close this modal and click anywhere directly on the map canvas to set custom GPS coordinates!
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition"
          >
            Cancel
          </button>

          {activeTab === 'ai_agent' ? (
            <button
              onClick={handleAiDispatch}
              disabled={isAiLoading || !aiPrompt.trim()}
              className="px-5 py-2.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-blue-500/30 transition flex items-center gap-2"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Waypoints...</span>
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5" />
                  <span>Dispatch Mission</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleConfirmPresetOrCustom}
              className="px-5 py-2.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-500/30 transition flex items-center gap-2"
            >
              <span>Initialize Trace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
