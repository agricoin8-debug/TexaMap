'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  TEXARKANA_CENTER,
  PRESET_LANDMARKS,
  GEOFENCE_ZONES,
  AutonomousAgent,
  findCurrentGeofence,
  calculateDistanceMiles
} from '@/lib/texarkana-data';

interface MapProps {
  agents: AutonomousAgent[];
  activeAgentId: string;
  activeTraceWaypoints: [number, number][];
  currentWaypointIndex: number;
  originCoords: [number, number];
  destinationCoords: [number, number] | null;
  destinationName: string | null;
  mapStyle: 'light' | 'dark' | 'satellite';
  followAgent: boolean;
  showGeofences: boolean;
  showLandmarks: boolean;
  onMapClickDestination: (coords: [number, number], name: string) => void;
  onLandmarkSelect: (key: string) => void;
  isTourActive?: boolean;
  focusedCoords?: [number, number] | null;
  hasRerouted?: boolean;
  isRerouting?: boolean;
}

export default function TexarkanaMap({
  agents,
  activeAgentId,
  activeTraceWaypoints,
  currentWaypointIndex,
  originCoords,
  destinationCoords,
  destinationName,
  mapStyle,
  followAgent,
  showGeofences,
  showLandmarks,
  onMapClickDestination,
  onLandmarkSelect,
  isTourActive,
  focusedCoords,
  hasRerouted = false,
  isRerouting = false
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const agentMarkersRef = useRef<Record<string, any>>({});
  const geofenceLayersRef = useRef<any[]>([]);
  const landmarkMarkersRef = useRef<any[]>([]);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const onMapClickRef = useRef(onMapClickDestination);
  useEffect(() => {
    onMapClickRef.current = onMapClickDestination;
  }, [onMapClickDestination]);

  // 1. Initialize Map once client-side
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      const L = await import('leaflet');

      if (!isMounted) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView(TEXARKANA_CENTER, 13);

        mapInstanceRef.current = map;

        // Click handler to set destination
        map.on('click', (e: any) => {
          const lat = Number(e.latlng.lat.toFixed(5));
          const lng = Number(e.latlng.lng.toFixed(5));
          onMapClickRef.current([lat, lng], `Custom Waypoint (${lat}, ${lng})`);
        });

        setLeafletLoaded(true);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Update Map Tiles based on style
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((L) => {
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const cartoKey = process.env.NEXT_PUBLIC_CARTO_BASEMAP_API;
      const cartoKeyQuery = cartoKey ? `?key=${encodeURIComponent(cartoKey)}` : '';
      let tileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${cartoKeyQuery}`;
      let maxZoom = 19;

      if (mapStyle === 'dark') {
        tileUrl = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${cartoKeyQuery}`;
      } else if (mapStyle === 'satellite') {
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        maxZoom = 18;
      }

      tileLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom,
        subdomains: 'abcd',
      }).addTo(map);
    });
  }, [mapStyle, leafletLoaded]);

  // 3. Render Geofence Polygons
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((L) => {
      // Clear previous geofences
      geofenceLayersRef.current.forEach((layer) => map.removeLayer(layer));
      geofenceLayersRef.current = [];

      if (!showGeofences) return;

      GEOFENCE_ZONES.forEach((zone) => {
        const isHazard = zone.type === 'hazardous' || zone.isHazardous;
        const polygon = L.polygon(zone.coordinates as any, {
          color: isHazard ? '#ef4444' : zone.color,
          weight: isHazard ? 3 : 2,
          opacity: isHazard ? 0.95 : 0.8,
          fillColor: isHazard ? '#dc2626' : zone.fillColor,
          fillOpacity: isHazard ? 0.32 : 0.12,
          dashArray: isHazard ? '6, 6' : zone.type === 'corridor' ? '4, 6' : undefined,
          className: isHazard ? 'hazardous-polygon' : undefined,
        }).addTo(map);

        const tooltipHtml = isHazard
          ? `<div style="background: rgba(153, 27, 27, 0.95); color: #fff; padding: 6px 10px; border-radius: 8px; font-family: monospace; border: 1.5px solid #ef4444; box-shadow: 0 4px 14px rgba(239,68,68,0.5);">
               <div style="font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 4px; color: #fecaca;">
                 <span>⚠️ HAZARDOUS GEOFENCE</span>
               </div>
               <div style="font-size: 10px; font-weight: 600; margin-top: 2px;">${zone.name}</div>
               <div style="font-size: 9px; opacity: 0.9; margin-top: 2px; max-width: 200px;">${zone.description}</div>
               <div style="margin-top: 4px; font-size: 8px; color: #fef08a; background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-weight: bold;">
                 ⚡ Auto-Reroute Engine Armed
               </div>
             </div>`
          : `<b>${zone.name}</b><br/><span style="font-size:10px">${zone.description}</span>`;

        polygon.bindTooltip(tooltipHtml, {
          sticky: true,
          className: isHazard ? 'hazard-tooltip-wrapper' : 'geofence-tooltip',
        });

        geofenceLayersRef.current.push(polygon);
      });
    });
  }, [showGeofences, leafletLoaded]);

  // 4. Render Landmark Badges
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((L) => {
      landmarkMarkersRef.current.forEach((m) => map.removeLayer(m));
      landmarkMarkersRef.current = [];

      if (!showLandmarks) return;

      Object.entries(PRESET_LANDMARKS).forEach(([key, landmark]) => {
        const iconHtml = `
          <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 9999px; padding: 3px 8px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); color: #e2e8f0; font-size: 10px; font-weight: 600; cursor: pointer; white-space: nowrap;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #3b82f6;"></div>
            <span>${landmark.name.split(' ')[0]}</span>
          </div>
        `;

        const icon = L.divIcon({
          className: 'landmark-chip-marker',
          html: iconHtml,
          iconSize: [80, 24],
          iconAnchor: [40, 12],
        });

        const marker = L.marker(landmark.coords, { icon }).addTo(map);

        marker.on('click', () => {
          onLandmarkSelect(key);
        });

        landmarkMarkersRef.current.push(marker);
      });
    });
  }, [showLandmarks, leafletLoaded, onLandmarkSelect]);

  // 5. Origin Marker (Pulse)
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((L) => {
      if (originMarkerRef.current) {
        map.removeLayer(originMarkerRef.current);
      }

      const pulseIcon = L.divIcon({
        className: 'origin-user-marker',
        html: `
          <div style="position: relative; width: 14px; height: 14px;">
            <div style="position: absolute; top:-6px; left:-6px; width: 26px; height: 26px; border-radius: 50%; background: rgba(59, 130, 246, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(37, 99, 235, 0.8);"></div>
          </div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      originMarkerRef.current = L.marker(originCoords, { icon: pulseIcon })
        .addTo(map)
        .bindPopup(`<b>Fleet Origin Base</b><br/>Texarkana [${originCoords[0]}, ${originCoords[1]}]`);
    });
  }, [originCoords, leafletLoaded]);

  // 6. Destination Marker
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((L) => {
      if (destMarkerRef.current) {
        map.removeLayer(destMarkerRef.current);
        destMarkerRef.current = null;
      }

      if (!destinationCoords) return;

      const destIcon = L.divIcon({
        className: 'destination-beacon-marker',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; transform: translateY(-100%);">
            <div style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 700; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); border: 1.5px solid white; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
              <span>TARGET: ${destinationName || 'Dest'}</span>
            </div>
            <div style="width: 2px; height: 8px; background: #ef4444;"></div>
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444; border: 2px solid white; box-shadow: 0 0 8px #ef4444;"></div>
          </div>
        `,
        iconSize: [120, 40],
        iconAnchor: [60, 40],
      });

      destMarkerRef.current = L.marker(destinationCoords, { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>Mission Target</b><br/>${destinationName || 'Custom Target'}`);
    });
  }, [destinationCoords, destinationName, leafletLoaded]);

  // 7. Route Polyline
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((L) => {
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }

      if (!activeTraceWaypoints || activeTraceWaypoints.length < 2) return;

      // Outer glow line with dynamic reroute alert/safe color
      const glowColor = isRerouting ? '#f59e0b' : hasRerouted ? '#10b981' : '#60a5fa';
      const mainColor = isRerouting ? '#d97706' : hasRerouted ? '#059669' : '#2563eb';

      const glowLine = L.polyline(activeTraceWaypoints as any, {
        color: glowColor,
        weight: hasRerouted || isRerouting ? 8 : 6,
        opacity: isRerouting ? 0.6 : hasRerouted ? 0.45 : 0.35,
      });

      // Core dashed animated route line
      const mainLine = L.polyline(activeTraceWaypoints as any, {
        color: mainColor,
        weight: 3.5,
        opacity: 0.95,
        dashArray: hasRerouted ? '6, 6' : '8, 8',
      });

      routeLayerRef.current = L.layerGroup([glowLine, mainLine]).addTo(map);

      // Fit bounds if not actively following agent
      if (!followAgent && !isTourActive) {
        map.fitBounds(mainLine.getBounds(), { padding: [60, 60], maxZoom: 15 });
      }
    });
  }, [activeTraceWaypoints, followAgent, isTourActive, hasRerouted, isRerouting, leafletLoaded]);

  // 8. Fleet Agent Markers & Heading updates
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((L) => {
      agents.forEach((agent) => {
        const isCurrentActive = agent.id === activeAgentId;
        const iconSize = isCurrentActive ? 34 : 26;
        const color = agent.avatarColor || '#3b82f6';

        const agentIconHtml = `
          <div style="position: relative; width: ${iconSize}px; height: ${iconSize}px; display: flex; align-items: center; justify-content: center;">
            ${
              isCurrentActive
                ? `<div style="position: absolute; inset: -5px; border-radius: 50%; background: ${color}33; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                : ''
            }
            <div style="width: ${iconSize}px; height: ${iconSize}px; border-radius: 50%; background: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; transform: rotate(${
          agent.headingDeg
        }deg); transition: transform 0.2s ease;">
              <svg width="${isCurrentActive ? 16 : 12}" height="${
          isCurrentActive ? 16 : 12
        }" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
              </svg>
            </div>
            ${
              isCurrentActive
                ? `<div style="position: absolute; top: -18px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 4px; white-space: nowrap;">${agent.callsign}</div>`
                : ''
            }
          </div>
        `;

        const icon = L.divIcon({
          className: `agent-marker-${agent.id}`,
          html: agentIconHtml,
          iconSize: [iconSize, iconSize],
          iconAnchor: [iconSize / 2, iconSize / 2],
        });

        if (!agentMarkersRef.current[agent.id]) {
          const marker = L.marker(agent.currentCoords, { icon }).addTo(map);
          marker.bindTooltip(
            `<b>${agent.name}</b><br/>Speed: ${agent.speedMph} mph | Bat: ${agent.battery}%`,
            { direction: 'top', offset: [0, -10] }
          );
          agentMarkersRef.current[agent.id] = marker;
        } else {
          const existingMarker = agentMarkersRef.current[agent.id];
          existingMarker.setLatLng(agent.currentCoords);
          existingMarker.setIcon(icon);
        }
      });

      // Follow active agent camera logic
      if (followAgent && !isTourActive) {
        const activeAgent = agents.find((a) => a.id === activeAgentId);
        if (activeAgent) {
          map.panTo(activeAgent.currentCoords, { animate: true, duration: 0.8 });
        }
      }
    });
  }, [agents, activeAgentId, followAgent, isTourActive, leafletLoaded]);

  // 9. Manual Agent Focus from Locate Button
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current || !focusedCoords) return;
    mapInstanceRef.current.panTo(focusedCoords, { animate: true, duration: 0.8 });
  }, [focusedCoords, leafletLoaded]);

  return (
    <div className="relative w-full h-full select-none">
      <div ref={mapContainerRef} className="w-full h-full" id="map-canvas" />
    </div>
  );
}
