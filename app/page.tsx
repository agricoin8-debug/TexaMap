'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Search,
  Route,
  Layers,
  Crosshair,
  Terminal,
  Shield,
  Building2,
  GraduationCap,
  Trees,
  Waves,
  Radio,
  Users,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import {
  TEXARKANA_CENTER,
  PRESET_LANDMARKS,
  INITIAL_FLEET,
  GEOFENCE_ZONES,
  AutonomousAgent,
  GeofenceZone,
  generateRoutePoints,
  calculateDistanceMiles,
  calculateBearingDeg,
  findCurrentGeofence,
  detectHazardOnPath,
  generateHazardEvasionRoute,
  isPointInsideOrNearPolygon
} from '@/lib/texarkana-data';
import AgentTraceCard from '@/components/dashboard/AgentTraceCard';
import FleetSummaryPanel from '@/components/dashboard/FleetSummaryPanel';
import TelemetryDrawer, { TelemetryLog } from '@/components/console/TelemetryDrawer';
import DestinationModal from '@/components/modals/DestinationModal';
import TourController, { TEXARKANA_TOUR_STEPS } from '@/components/dashboard/TourController';

// Dynamically import TexarkanaMap to avoid SSR Leaflet window error
const TexarkanaMap = dynamic(() => import('@/components/map/TexarkanaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-slate-400 gap-3 select-none">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-mono tracking-wider text-slate-300">INITIALIZING TEXARKANA GEOPROCESSOR...</p>
    </div>
  ),
});

const DEFAULT_INITIAL_LOGS: TelemetryLog[] = [
  {
    id: 'log-init-1',
    timestamp: '00:00:01',
    tag: 'BACKEND_INIT',
    message: 'Autonomous Mission Core v4.8 initialized. Bi-state GIS geofences mapped for Texarkana, TX / Texarkana, AR.',
  },
  {
    id: 'log-init-2',
    timestamp: '00:00:02',
    tag: 'GEOPROCESSOR',
    message: 'Locked telemetry anchor: [33.4251, -94.0477]. Precision GNSS RTK lock achieved (14 Sats).',
  },
];

const subscribeEmpty = () => () => {};

export default function Home() {
  const mounted = React.useSyncExternalStore(
    subscribeEmpty,
    () => true,
    () => false
  );

  // --- Fleet & Active Agent State ---
  const [fleet, setFleet] = useState<AutonomousAgent[]>(INITIAL_FLEET);
  const [activeAgentId, setActiveAgentId] = useState<string>('agent-apex-01');

  // --- Map Visual State ---
  const [mapStyle, setMapStyle] = useState<'light' | 'dark' | 'satellite'>('dark');
  const [followAgent, setFollowAgent] = useState<boolean>(true);
  const [showGeofences, setShowGeofences] = useState<boolean>(true);
  const [showLandmarks, setShowLandmarks] = useState<boolean>(true);
  const [showFleetSummary, setShowFleetSummary] = useState<boolean>(true);
  const [focusedCoords, setFocusedCoords] = useState<[number, number] | null>(null);

  // --- Trace & Mission State ---
  const [isTraceActive, setIsTraceActive] = useState<boolean>(false);
  const [speedMode, setSpeedMode] = useState<'slow' | 'normal' | 'cruise'>('slow');
  const [destinationName, setDestinationName] = useState<string>('State Line Post Office');
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(
    PRESET_LANDMARKS.courtHouse.coords
  );
  const originCoords: [number, number] = TEXARKANA_CENTER;
  const [waypoints, setWaypoints] = useState<[number, number][]>([]);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState<number>(0);
  const [activeGeofence, setActiveGeofence] = useState<GeofenceZone | null>(null);
  const [hasRerouted, setHasRerouted] = useState<boolean>(false);
  const [isRerouting, setIsRerouting] = useState<boolean>(false);

  // --- Telemetry Drawer & Logs ---
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<TelemetryLog[]>(DEFAULT_INITIAL_LOGS);
  const [packetCounter, setPacketCounter] = useState<number>(1042);
  const [latencyMs, setLatencyMs] = useState<number>(18);

  // --- Modals & Tours ---
  const [isDestModalOpen, setIsDestModalOpen] = useState<boolean>(false);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [tourStepIndex, setTourStepIndex] = useState<number>(0);

  // --- Toast Notification State ---
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 3200);
  }, []);

  const addLog = useCallback(
    (tag: TelemetryLog['tag'], message: string, data?: any) => {
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
      const newLog: TelemetryLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: timeStr,
        tag,
        message,
        data,
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 199)]);
      setPacketCounter((p) => p + 1);
    },
    []
  );

  const activeAgent = fleet.find((a) => a.id === activeAgentId) || fleet[0];

  // --- Locate Agent on Map ---
  const handleLocateAgent = useCallback(
    (coords: [number, number], agentName: string) => {
      setFollowAgent(false);
      setFocusedCoords([coords[0], coords[1]]);
      showToast(`Located ${agentName} on map`);
      addLog(
        'GEOPROCESSOR',
        `Camera focused on agent [${agentName}] at coordinates [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}].`
      );
    },
    [addLog, showToast]
  );

  // --- Automated Rerouting Engine around Hazardous Geofences ---
  const triggerAutomatedReroute = useCallback(
    (fromCoord: [number, number], toCoord: [number, number], hazard: GeofenceZone) => {
      setIsRerouting(true);
      setHasRerouted(true);

      addLog(
        'ALERT',
        `⚠️ HAZARDOUS GEOFENCE DETECTED: Path intersects [${hazard.name}]. Autonomous reroute algorithm initiated.`
      );
      showToast(`⚠️ Hazard Encountered! Auto-rerouting around ${hazard.name}`);

      // Generate smooth bypass trajectory that safely clears the hazardous boundary
      const evasionPts = generateHazardEvasionRoute(fromCoord, toCoord, hazard, 180);
      setWaypoints(evasionPts);
      setCurrentWaypointIndex(0);

      addLog(
        'VELOCITY_PID',
        `PID Trajectory Engine: Computed ${evasionPts.length} safe detour waypoints. Bypass clearance: +0.82 mi around exclusion zone.`
      );
      addLog(
        'AI_MISSION',
        `Automated Rerouting Active: Trajectory safely diverted outside ${hazard.name}. Mission tracking resumed.`
      );

      setTimeout(() => {
        setIsRerouting(false);
      }, 3500);
    },
    [addLog, showToast]
  );

  // --- Initialize Route Trace Function ---
  const initializeTrace = useCallback(
    (targetName: string, targetCoords: [number, number], aiPlan?: any) => {
      setDestinationName(targetName);
      setDestinationCoords(targetCoords);
      setHasRerouted(false);
      setIsRerouting(false);

      const start = activeAgent.currentCoords;
      // High-resolution 180 points for smooth, reduced speed movement
      const pts = generateRoutePoints(start, targetCoords, 180);
      setWaypoints(pts);
      setCurrentWaypointIndex(0);
      setIsTraceActive(true);

      // Update fleet active agent with en_route status and assigned destination
      setFleet((prev) =>
        prev.map((agent) =>
          agent.id === activeAgentId
            ? {
                ...agent,
                status: 'en_route',
                assignedDestination: targetName,
                destinationCoords: targetCoords,
              }
            : agent
        )
      );

      const totalDist = calculateDistanceMiles(start, targetCoords);

      addLog(
        'AI_MISSION',
        `Autonomous Mission engaged: [${targetName}]. Vector distance: ${totalDist} mi across ${pts.length} waypoints (Reduced cruise throttle active).`
      );

      if (aiPlan?.tacticalSummary) {
        addLog('AI_MISSION', `Commander Summary: ${aiPlan.tacticalSummary}`);
      }

      showToast(`Target Set: ${targetName}`);
    },
    [activeAgent.currentCoords, activeAgentId, addLog, showToast]
  );

  // --- Simulated Hazard Encounter Demonstration Trigger ---
  const handleSimulateHazard = useCallback(() => {
    const hazardZone =
      GEOFENCE_ZONES.find((z) => z.isHazardous) || GEOFENCE_ZONES[GEOFENCE_ZONES.length - 1];

    if (isTraceActive && destinationCoords) {
      triggerAutomatedReroute(activeAgent.currentCoords, destinationCoords, hazardZone);
    } else {
      // Start mission toward TAMUT (crosses the State Line corridor) and trigger automated reroute
      const target = PRESET_LANDMARKS.tamut;
      initializeTrace(target.name, target.coords);
      setTimeout(() => {
        triggerAutomatedReroute(activeAgent.currentCoords, target.coords, hazardZone);
      }, 1400);
    }
  }, [
    isTraceActive,
    destinationCoords,
    activeAgent.currentCoords,
    triggerAutomatedReroute,
    initializeTrace,
  ]);

  // --- Read URL search params safely after mounting ---
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const traceParam = urlParams.get('trace');
      const landmarkParam = urlParams.get('landmark');

      if (traceParam) {
        try {
          const parsed = JSON.parse(decodeURIComponent(traceParam));
          if (parsed.dest && parsed.lat && parsed.lng) {
            initializeTrace(parsed.dest, [parsed.lat, parsed.lng]);
          }
        } catch (e) {
          console.error('Failed to parse shared trace URL param', e);
        }
      } else if (landmarkParam && PRESET_LANDMARKS[landmarkParam]) {
        const l = PRESET_LANDMARKS[landmarkParam];
        initializeTrace(l.name, l.coords);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [mounted, initializeTrace]);

  // --- Stop Active Trace ---
  const stopTrace = useCallback(() => {
    setIsTraceActive(false);
    setWaypoints([]);
    setCurrentWaypointIndex(0);

    setFleet((prev) =>
      prev.map((agent) =>
        agent.id === activeAgentId ? { ...agent, status: 'idle', speedMph: 0 } : agent
      )
    );

    addLog('SYSTEM', `Trace session terminated by operator. Agent ${activeAgent.callsign} holding position.`);
    showToast('Trace terminated. Agent holding position.');
  }, [activeAgentId, activeAgent.callsign, addLog, showToast]);

  // --- Autonomous Ticking Simulation Loop with Reduced Speed ---
  useEffect(() => {
    if (!isTraceActive || waypoints.length === 0) return;

    // Slower tick intervals for relaxed, steady tracking
    const intervalMs = speedMode === 'slow' ? 1200 : speedMode === 'normal' ? 850 : 550;

    const interval = setInterval(() => {
      setCurrentWaypointIndex((prevIdx) => {
        if (prevIdx >= waypoints.length - 1) {
          setIsTraceActive(false);
          setFleet((fleetPrev) =>
            fleetPrev.map((ag) =>
              ag.id === activeAgentId
                ? {
                    ...ag,
                    status: 'completed',
                    speedMph: 0,
                    currentCoords: waypoints[waypoints.length - 1],
                  }
                : ag
            )
          );
          addLog('SYSTEM', `Mission accomplished: Target ${destinationName} reached successfully.`);
          showToast(`Agent arrived at ${destinationName}!`);
          return prevIdx;
        }

        const nextIdx = prevIdx + 1;
        const currentPt = waypoints[nextIdx];
        const prevPt = waypoints[prevIdx];

        const heading = calculateBearingDeg(prevPt, currentPt);

        // Reduced velocity profiling
        const baseSpeed =
          speedMode === 'slow'
            ? Math.floor(14 + Math.random() * 4) // 14-18 mph (Reduced movement speed)
            : speedMode === 'normal'
            ? Math.floor(22 + Math.random() * 6) // 22-28 mph (Standard)
            : Math.floor(32 + Math.random() * 8); // 32-40 mph (Cruise)

        const currentZone = findCurrentGeofence(currentPt);
        setActiveGeofence(currentZone);

        // --- Automated Dynamic Rerouting when encountering Hazardous Geofence ---
        if (!hasRerouted && destinationCoords) {
          const hazardZone = GEOFENCE_ZONES.find((z) => z.isHazardous);
          if (hazardZone) {
            const isInsideHazard = isPointInsideOrNearPolygon(currentPt, hazardZone.coordinates, 0.0018);
            const pathHazardScan = detectHazardOnPath(waypoints, nextIdx, hazardZone);

            if (isInsideHazard || (pathHazardScan.hasHazard && pathHazardScan.distanceToHazardMiles < 0.45)) {
              triggerAutomatedReroute(currentPt, destinationCoords, hazardZone);
              return 0;
            }
          }
        }

        const cappedSpeed = currentZone?.maxSpeedMph ? Math.min(baseSpeed, currentZone.maxSpeedMph) : baseSpeed;

        setFleet((fleetPrev) =>
          fleetPrev.map((ag) => {
            if (ag.id !== activeAgentId) return ag;
            const newBat = Math.max(5, ag.battery - 0.02);
            return {
              ...ag,
              status: 'en_route',
              speedMph: cappedSpeed,
              currentCoords: currentPt,
              headingDeg: heading,
              battery: Number(newBat.toFixed(1)),
              currentZone: currentZone?.name,
            };
          })
        );

        if (nextIdx % 10 === 0) {
          addLog(
            'GEOPROCESSOR',
            `Pos: [${currentPt[0].toFixed(5)}, ${currentPt[1].toFixed(5)}] | Hdg: ${heading}° | Vel: ${cappedSpeed} mph | Bat: ${activeAgent.battery}%`
          );
        }

        const prevZone = findCurrentGeofence(prevPt);
        if (currentZone?.id !== prevZone?.id && currentZone) {
          addLog(
            'GEOFENCE',
            `Entered geofence boundary: [${currentZone.name}] (${currentZone.type.toUpperCase()}). Max allowed speed: ${currentZone.maxSpeedMph} mph.`
          );
        }

        setLatencyMs(15 + Math.floor(Math.random() * 8));

        return nextIdx;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [
    isTraceActive,
    waypoints,
    activeAgentId,
    destinationName,
    destinationCoords,
    hasRerouted,
    triggerAutomatedReroute,
    activeAgent.battery,
    speedMode,
    addLog,
    showToast,
  ]);

  // --- Start & Step Automated Tour ---
  const handleStartTour = useCallback(() => {
    setIsTourActive(true);
    setTourStepIndex(0);
    const step = TEXARKANA_TOUR_STEPS[0];
    addLog('AI_MISSION', `Automated Tour Stop 1: ${step.name}. Camera tracking scenic waypoint.`);
    showToast(`Tour Stop 1: ${step.name}`);
    initializeTrace(step.name, step.coords);
  }, [addLog, initializeTrace, showToast]);

  const handleNextTourStep = useCallback(() => {
    const nextIdx = (tourStepIndex + 1) % TEXARKANA_TOUR_STEPS.length;
    setTourStepIndex(nextIdx);
    const step = TEXARKANA_TOUR_STEPS[nextIdx];
    addLog('AI_MISSION', `Automated Tour Stop ${nextIdx + 1}: ${step.name}. Camera tracking scenic waypoint.`);
    showToast(`Tour Stop ${nextIdx + 1}: ${step.name}`);
    initializeTrace(step.name, step.coords);
  }, [tourStepIndex, addLog, initializeTrace, showToast]);

  const handleStopTour = useCallback(() => {
    setIsTourActive(false);
    showToast('Automated tour ended');
  }, [showToast]);

  // --- Copy Shareable Link ---
  const handleCopyShareLink = () => {
    if (typeof window === 'undefined') return;
    const payload = encodeURIComponent(
      JSON.stringify({
        dest: destinationName,
        lat: destinationCoords ? destinationCoords[0] : TEXARKANA_CENTER[0],
        lng: destinationCoords ? destinationCoords[1] : TEXARKANA_CENTER[1],
        agent: activeAgentId,
      })
    );
    const fullUrl = `${window.location.origin}${window.location.pathname}?trace=${payload}`;

    const el = document.createElement('textarea');
    el.value = fullUrl;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    showToast('Secure trace link copied to clipboard!');
    addLog('SYSTEM', `Shareable mission link synchronized: ${fullUrl}`);
  };

  // --- Inject Simulated Obstacle / Emergency RTH ---
  const handleInjectObstacle = () => {
    addLog(
      'ALERT',
      'SIMULATED INCIDENT: State Line Ave construction block detected! Autonomous path recalculation triggered.'
    );
    showToast('Incident Injected: Roadway blocked, rerouting!');

    if (destinationCoords) {
      const pts = generateRoutePoints(activeAgent.currentCoords, destinationCoords, 180);
      setWaypoints(pts);
      setCurrentWaypointIndex(0);
      addLog('VELOCITY_PID', 'PID trajectory recalculation complete. New evasion waypoints loaded.');
    }
  };

  const handleEmergencyRTH = () => {
    addLog('ALERT', 'EMERGENCY RTH: Aborting current mission. Initiating automated Return To Home protocol.');
    showToast('Emergency RTH Initiated!');
    initializeTrace('Texarkana Central Fleet Depot', TEXARKANA_CENTER);
  };

  // Computed metrics
  const remainingDist =
    waypoints.length > 0 && currentWaypointIndex < waypoints.length
      ? calculateDistanceMiles(waypoints[currentWaypointIndex], waypoints[waypoints.length - 1])
      : 0;
  const currentSpeed = activeAgent.speedMph || 36;
  const etaMins = currentSpeed > 0 ? Math.ceil((remainingDist / currentSpeed) * 60) : 0;

  if (!mounted) {
    return (
      <main className="relative w-screen h-screen overflow-hidden command-center-bg font-sans text-gray-100 flex flex-col items-center justify-center select-none" suppressHydrationWarning>
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono tracking-wider text-slate-300 mt-3">INITIALIZING TEXARKANA GEOPROCESSOR...</p>
      </main>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden command-center-bg font-sans text-gray-100 select-none" suppressHydrationWarning>
      {/* Permanent Aerospace / Defense Command Center Background Template */}
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-tr" />
      <div className="hud-corner hud-corner-bl" />
      <div className="hud-corner hud-corner-br" />

      {/* Top Aerospace Ticker Strip */}
      <div className="absolute top-1 left-10 right-10 z-10 pointer-events-none flex items-center justify-between text-[9px] font-mono tracking-widest text-blue-400/80 border-b border-blue-500/15 pb-1 select-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="font-bold">TEXARKANA AUTONOMOUS OPERATIONS CORE // AR-TX GRID</span>
        </div>
        <div className="hidden lg:flex items-center gap-4 text-slate-400">
          <span>LAT: 33°25&apos;30&quot; N</span>
          <span>LNG: 94°02&apos;51&quot; W</span>
          <span>GEOID: WGS-84</span>
          <span>RTK LOCK: 14 SATS</span>
          <span className="text-emerald-400 font-bold">STATUS: ARMED</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>BI-STATE CORRIDOR</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* Viewport Frame Border */}
      <div className="absolute inset-2 sm:inset-2.5 rounded-3xl border border-blue-500/20 pointer-events-none z-10 shadow-[inset_0_0_30px_rgba(30,58,138,0.12)]" />

      {/* Coordinate Gradation Edge Ticks */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-none z-10 text-[7px] font-mono text-blue-500/40 select-none">
        <span>+33.48°</span>
        <span>+33.45°</span>
        <span>+33.42°</span>
        <span>+33.39°</span>
      </div>
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-10 pointer-events-none z-10 text-[7px] font-mono text-blue-500/40 select-none">
        <span>-94.12°</span>
        <span>-94.08°</span>
        <span>-94.04°</span>
        <span>-94.00°</span>
      </div>

      {/* 1. Fullscreen Map Canvas */}
      <TexarkanaMap
        agents={fleet}
        activeAgentId={activeAgentId}
        activeTraceWaypoints={waypoints}
        currentWaypointIndex={currentWaypointIndex}
        originCoords={originCoords}
        destinationCoords={destinationCoords}
        destinationName={destinationName}
        mapStyle={mapStyle}
        followAgent={followAgent}
        showGeofences={showGeofences}
        showLandmarks={showLandmarks}
        focusedCoords={focusedCoords}
        hasRerouted={hasRerouted}
        isRerouting={isRerouting}
        onMapClickDestination={(coords, name) => {
          setDestinationCoords(coords);
          setDestinationName(name);
          initializeTrace(name, coords);
        }}
        onLandmarkSelect={(key) => {
          const l = PRESET_LANDMARKS[key];
          if (l) {
            initializeTrace(l.name, l.coords);
          }
        }}
        isTourActive={isTourActive}
      />

      {/* 2. Top Search & Navigation Bar (Floating) */}
      <div className="absolute top-5 left-4 right-4 md:left-6 md:w-[440px] z-20 space-y-3 pointer-events-none">
        <div className="pointer-events-auto glass-panel rounded-2xl flex items-center px-4 py-2.5 transition-all duration-300 hover:border-blue-500/40">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mr-2.5 shrink-0">
            <Radio className="w-4 h-4 animate-pulse text-blue-400" />
          </div>
          <input
            type="text"
            readOnly
            onClick={() => setIsDestModalOpen(true)}
            value={destinationName ? `Target: ${destinationName}` : ''}
            placeholder="Search Texarkana or set destination..."
            className="w-full bg-transparent border-none focus:outline-none text-xs sm:text-sm text-gray-100 placeholder-gray-400 font-medium cursor-pointer"
          />
          <button
            onClick={() => setIsDestModalOpen(true)}
            className="ml-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/25 transition flex items-center gap-2 group shrink-0"
          >
            <Route className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
            <span>Trace</span>
          </button>
        </div>

        {/* Quick Landmark Chips Bar */}
        <div className="pointer-events-auto flex items-center space-x-2.5 overflow-x-auto no-scrollbar py-1 text-xs">
          <button
            onClick={() => {
              const l = PRESET_LANDMARKS.courtHouse;
              initializeTrace(l.name, l.coords);
            }}
            className="whitespace-nowrap px-3.5 py-1.5 glass-panel text-xs font-medium rounded-xl hover:bg-white/10 transition flex items-center gap-2 text-gray-200"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>State Line Post Office</span>
          </button>

          <button
            onClick={() => {
              const l = PRESET_LANDMARKS.tamut;
              initializeTrace(l.name, l.coords);
            }}
            className="whitespace-nowrap px-3.5 py-1.5 glass-panel text-xs font-medium rounded-xl hover:bg-white/10 transition flex items-center gap-2 text-gray-200"
          >
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
            <span>TAMU-Texarkana</span>
          </button>

          <button
            onClick={() => {
              const l = PRESET_LANDMARKS.springLake;
              initializeTrace(l.name, l.coords);
            }}
            className="whitespace-nowrap px-3.5 py-1.5 glass-panel text-xs font-medium rounded-xl hover:bg-white/10 transition flex items-center gap-2 text-gray-200"
          >
            <Trees className="w-3.5 h-3.5 text-emerald-400" />
            <span>Spring Lake Park</span>
          </button>

          <button
            onClick={() => {
              const l = PRESET_LANDMARKS.wrightPatman;
              initializeTrace(l.name, l.coords);
            }}
            className="whitespace-nowrap px-3.5 py-1.5 glass-panel text-xs font-medium rounded-xl hover:bg-white/10 transition flex items-center gap-2 text-gray-200"
          >
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>Wright Patman Lake</span>
          </button>

          {/* Simulated Hazard Auto-Reroute Trigger */}
          <button
            onClick={handleSimulateHazard}
            className="whitespace-nowrap px-3.5 py-1.5 glass-panel text-xs font-semibold rounded-xl bg-red-950/40 border border-red-500/40 hover:bg-red-900/60 transition flex items-center gap-1.5 text-red-300 hover:text-white"
            title="Demonstrate automated dynamic rerouting around the State Line Hazmat incident"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>Hazard Auto-Reroute</span>
          </button>

          {/* Automated Tour Trigger */}
          <TourController
            isTourActive={isTourActive}
            currentStepIndex={tourStepIndex}
            onStartTour={handleStartTour}
            onStopTour={handleStopTour}
            onNextStep={handleNextTourStep}
          />
        </div>
      </div>

      {/* 3. Top-Right Map Controls Stack */}
      <div className="absolute top-5 right-4 z-20 flex flex-col items-end space-y-2.5 pointer-events-none">
        {/* Fleet Selector Pill */}
        <div className="pointer-events-auto glass-panel rounded-2xl p-1 flex items-center gap-1 shadow-xl">
          {fleet.map((ag) => {
            const isSelected = ag.id === activeAgentId;
            return (
              <button
                key={ag.id}
                onClick={() => {
                  setActiveAgentId(ag.id);
                  showToast(`Switched active agent to ${ag.name}`);
                  addLog('SYSTEM', `Operator command: Focused fleet telemetry on ${ag.callsign}`);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    ag.id === 'agent-apex-01'
                      ? 'bg-blue-500'
                      : ag.id === 'agent-scout-02'
                      ? 'bg-purple-500'
                      : 'bg-emerald-500'
                  }`}
                />
                <span className="hidden sm:inline font-mono">{ag.callsign}</span>
              </button>
            );
          })}
        </div>

        {/* Map Control Buttons */}
        <div className="pointer-events-auto flex flex-col space-y-2.5">
          {/* Map Tile Style Toggle */}
          <button
            onClick={() => {
              const nextStyle =
                mapStyle === 'dark' ? 'light' : mapStyle === 'light' ? 'satellite' : 'dark';
              setMapStyle(nextStyle);
              showToast(`Map layer: ${nextStyle.toUpperCase()}`);
              addLog('SYSTEM', `Map raster layer switched to ${nextStyle}`);
            }}
            title={`Toggle Map Style (Current: ${mapStyle})`}
            className="w-11 h-11 glass-panel rounded-2xl flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition shadow-lg"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Toggle Fleet Summary Matrix Panel */}
          <button
            onClick={() => {
              setShowFleetSummary((prev) => !prev);
              showToast(!showFleetSummary ? 'Fleet Summary Matrix Enabled' : 'Fleet Summary Hidden');
            }}
            title={showFleetSummary ? 'Hide Fleet Summary Panel' : 'Show Fleet Summary Panel'}
            className={`w-11 h-11 rounded-2xl shadow-lg border transition flex items-center justify-center ${
              showFleetSummary
                ? 'bg-blue-950/80 border-blue-500/50 text-blue-400'
                : 'glass-panel text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Recenter Map on Texarkana */}
          <button
            onClick={() => {
              setFollowAgent(false);
              showToast('Centered on Texarkana Matrix');
              addLog('GEOPROCESSOR', 'Camera recentered on Texarkana anchor [33.4251, -94.0477].');
            }}
            title="Recenter on Texarkana"
            className="w-11 h-11 glass-panel rounded-2xl flex items-center justify-center text-blue-400 hover:bg-white/10 transition shadow-lg"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Toggle Geofence Polygons */}
          <button
            onClick={() => {
              setShowGeofences((prev) => !prev);
              showToast(!showGeofences ? 'Geofences Enabled' : 'Geofences Hidden');
            }}
            title={showGeofences ? 'Hide Geofence Zones' : 'Show Geofence Zones'}
            className={`w-11 h-11 rounded-2xl shadow-lg border transition flex items-center justify-center ${
              showGeofences
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                : 'glass-panel text-gray-400 hover:text-gray-200'
            }`}
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* Toggle Backend Agent Telemetry Drawer */}
          <button
            onClick={() => setIsConsoleOpen((prev) => !prev)}
            title="Toggle Backend Telemetry Stream"
            className="w-11 h-11 bg-slate-900 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center hover:bg-slate-800 transition shadow-lg relative group"
          >
            <Terminal className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#10b981] animate-ping"></span>
          </button>
        </div>
      </div>

      {/* 4. Active Map Trace Navigation Dashboard Card */}
      {isTraceActive && (
        <div className="absolute top-24 md:top-24 right-4 left-4 md:left-auto md:w-88 z-20 pointer-events-none">
          <AgentTraceCard
            agent={activeAgent}
            destinationName={destinationName}
            etaMinutes={etaMins}
            remainingDistanceMi={remainingDist}
            currentSpeedMph={activeAgent.speedMph}
            activeGeofence={activeGeofence}
            followAgent={followAgent}
            speedMode={speedMode}
            hasRerouted={hasRerouted}
            isRerouting={isRerouting}
            onSimulateHazard={handleSimulateHazard}
            onSpeedModeChange={(mode) => {
              setSpeedMode(mode);
              showToast(
                `Speed mode: ${
                  mode === 'slow'
                    ? 'Reduced (16 mph)'
                    : mode === 'normal'
                    ? 'Normal (25 mph)'
                    : 'Cruise (35 mph)'
                }`
              );
              addLog('VELOCITY_PID', `Throttle governor set to ${mode.toUpperCase()} speed mode.`);
            }}
            onToggleFollow={() => {
              setFollowAgent((prev) => !prev);
              showToast(!followAgent ? 'Camera locked to agent' : 'Camera unlocked');
            }}
            onStopTrace={stopTrace}
            onCopyShareLink={handleCopyShareLink}
          />
        </div>
      )}

      {/* 5. Floating Fleet Summary Table Panel (Visible even when not in a trace) */}
      {showFleetSummary && (
        <div className="absolute bottom-14 left-4 md:left-6 z-20 max-w-[calc(100vw-2rem)] md:max-w-[480px]">
          <FleetSummaryPanel
            fleet={fleet}
            activeAgentId={activeAgentId}
            onSelectAgent={(agentId) => {
              setActiveAgentId(agentId);
              const ag = fleet.find((a) => a.id === agentId);
              if (ag) {
                showToast(`Switched active agent to ${ag.name}`);
              }
            }}
            onLocateAgent={handleLocateAgent}
            onStartAgentTrace={(agent) => {
              setActiveAgentId(agent.id);
              if (agent.destinationCoords && agent.assignedDestination) {
                initializeTrace(agent.assignedDestination, agent.destinationCoords);
              } else {
                setIsDestModalOpen(true);
              }
            }}
          />
        </div>
      )}

      {/* 5. Destination & Mission Selection Modal */}
      <DestinationModal
        isOpen={isDestModalOpen}
        onClose={() => setIsDestModalOpen(false)}
        activeAgentName={activeAgent.name}
        onConfirmDestination={(name, coords, aiPlan) => {
          initializeTrace(name, coords, aiPlan);
        }}
      />

      {/* 6. Backend Agent Telemetry Console Drawer */}
      <TelemetryDrawer
        logs={logs}
        isOpen={isConsoleOpen}
        onToggle={() => setIsConsoleOpen((prev) => !prev)}
        onClear={() => {
          setLogs([]);
          addLog('SYSTEM', 'Telemetry stream buffer cleared.');
        }}
        onInjectObstacle={handleInjectObstacle}
        onEmergencyRTH={handleEmergencyRTH}
        streamRateHz={2.4}
        packetCount={packetCounter}
        latencyMs={latencyMs}
      />

      {/* 7. Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-panel text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-medium flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 border border-blue-500/30">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{toastMsg}</span>
        </div>
      )}
    </main>
  );
}
