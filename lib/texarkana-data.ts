export interface Landmark {
  id: string;
  name: string;
  address: string;
  category: 'government' | 'education' | 'recreation' | 'transit' | 'culture';
  coords: [number, number]; // [lat, lng]
  description: string;
  iconName: string;
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'safe' | 'warning' | 'restricted' | 'corridor' | 'hazardous';
  color: string;
  fillColor: string;
  coordinates: [number, number][];
  description: string;
  maxSpeedMph: number;
  isHazardous?: boolean;
}

export interface AutonomousAgent {
  id: string;
  name: string;
  callsign: string;
  type: 'ground_rover' | 'surveillance_drone' | 'transit_shuttle';
  status: 'idle' | 'en_route' | 'holding' | 'emergency_rth' | 'completed';
  battery: number; // percentage
  speedMph: number;
  altitudeM: number;
  currentCoords: [number, number];
  headingDeg: number;
  signalRssi: number; // -30 to -90 dBm
  currentZone?: string;
  autonomyLevel: 'L3 Conditional' | 'L4 High' | 'L5 Full Autonomous';
  avatarColor: string;
  assignedDestination?: string;
  destinationCoords?: [number, number];
}

export const TEXARKANA_CENTER: [number, number] = [33.4251, -94.0477];

export const PRESET_LANDMARKS: Record<string, Landmark> = {
  courtHouse: {
    id: 'courtHouse',
    name: 'State Line Post Office & Federal Courthouse',
    address: '500 N State Line Ave, Texarkana, TX/AR 75501',
    category: 'government',
    coords: [33.4253, -94.0430],
    description: 'The iconic national landmark straddling the Texas-Arkansas state boundary.',
    iconName: 'Building2'
  },
  tamut: {
    id: 'tamut',
    name: 'Texas A&M University - Texarkana',
    address: '7101 University Ave, Texarkana, TX 75503',
    category: 'education',
    coords: [33.4735, -94.1165],
    description: 'Premier university campus in Northeast Texas with autonomous tech research testbeds.',
    iconName: 'GraduationCap'
  },
  springLake: {
    id: 'springLake',
    name: 'Spring Lake Park',
    address: '4303 N Park Rd, Texarkana, TX 75501',
    category: 'recreation',
    coords: [33.4601, -94.0674],
    description: 'Expansive 145-acre park with lake, nature trails, and green open spaces.',
    iconName: 'Trees'
  },
  wrightPatman: {
    id: 'wrightPatman',
    name: 'Wright Patman Lake Reservoir',
    address: 'Texarkana Regional Reservoir, TX 75501',
    category: 'recreation',
    coords: [33.2970, -94.1685],
    description: 'Scenic 20,000+ acre reservoir on the Sulphur River for regional drone missions.',
    iconName: 'Waves'
  },
  perotTheatre: {
    id: 'perotTheatre',
    name: 'Historic Perot Theatre',
    address: '221 Main St, Texarkana, TX 75501',
    category: 'culture',
    coords: [33.4222, -94.0433],
    description: 'Majestic 1924 Italian Renaissance theatre in the heart of the arts district.',
    iconName: 'Sparkles'
  },
  regionalAirport: {
    id: 'regionalAirport',
    name: 'Texarkana Regional Airport (TXK)',
    address: '201 Airport Dr, Texarkana, AR 71854',
    category: 'transit',
    coords: [33.4539, -93.9910],
    description: 'Regional aviation hub with strict geofenced airspace control.',
    iconName: 'Plane'
  },
  fourStates: {
    id: 'fourStates',
    name: 'Four States Fair & Entertainment Complex',
    address: '3700 E 50th St, Texarkana, AR 71854',
    category: 'culture',
    coords: [33.4503, -94.0255],
    description: 'Events arena and agricultural fairgrounds for automated payload drop demos.',
    iconName: 'Tent'
  }
};

export const GEOFENCE_ZONES: GeofenceZone[] = [
  {
    id: 'zone-stateline-corridor',
    name: 'State Line Interstate Corridor (TX / AR)',
    type: 'corridor',
    color: '#3b82f6',
    fillColor: '#3b82f6',
    maxSpeedMph: 45,
    description: 'Active cross-border bi-state transport corridor with dual-jurisdiction telemetry synchronization.',
    coordinates: [
      [33.4400, -94.0460],
      [33.4400, -94.0400],
      [33.4150, -94.0400],
      [33.4150, -94.0460]
    ]
  },
  {
    id: 'zone-tamut-campus',
    name: 'TAMU-Texarkana Autonomous Testbed',
    type: 'safe',
    color: '#10b981',
    fillColor: '#10b981',
    maxSpeedMph: 25,
    description: 'Designated low-speed autonomous research perimeter with pedestrian priority sensors.',
    coordinates: [
      [33.4800, -94.1250],
      [33.4800, -94.1080],
      [33.4670, -94.1080],
      [33.4670, -94.1250]
    ]
  },
  {
    id: 'zone-springlake-reserve',
    name: 'Spring Lake Environmental Quiet Zone',
    type: 'warning',
    color: '#f59e0b',
    fillColor: '#f59e0b',
    maxSpeedMph: 15,
    description: 'Acoustic sensitive nature corridor. Drone propulsion throttled to 40% noise profile.',
    coordinates: [
      [33.4660, -94.0750],
      [33.4660, -94.0600],
      [33.4540, -94.0600],
      [33.4540, -94.0750]
    ]
  },
  {
    id: 'zone-airport-airspace',
    name: 'TXK Airspace Safety Exclusion Buffer',
    type: 'restricted',
    color: '#ef4444',
    fillColor: '#ef4444',
    maxSpeedMph: 0,
    description: 'FAA Class D exclusion zone. Ground rovers permitted on perimeter roads only.',
    coordinates: [
      [33.4650, -94.0050],
      [33.4650, -93.9780],
      [33.4420, -93.9780],
      [33.4420, -94.0050]
    ]
  },
  {
    id: 'zone-downtown-hazard',
    name: 'State Line Hazmat Incident Corridor',
    type: 'hazardous',
    color: '#ef4444',
    fillColor: '#dc2626',
    maxSpeedMph: 0,
    description: 'SIMULATED HAZARDOUS ZONE: Active chemical spill containment perimeter on State Line Ave. Autonomous vehicles must trigger automatic rerouting around this exclusion boundary.',
    isHazardous: true,
    coordinates: [
      [33.4420, -94.0505],
      [33.4420, -94.0370],
      [33.4290, -94.0370],
      [33.4290, -94.0505]
    ]
  }
];

export const INITIAL_FLEET: AutonomousAgent[] = [
  {
    id: 'agent-apex-01',
    name: 'Apex-01 Delivery Rover',
    callsign: 'APEX-ROVER',
    type: 'ground_rover',
    status: 'idle',
    battery: 94,
    speedMph: 0,
    altitudeM: 1.2,
    currentCoords: [33.4251, -94.0477],
    headingDeg: 45,
    signalRssi: -48,
    autonomyLevel: 'L4 High',
    avatarColor: '#2563eb',
    assignedDestination: 'State Line Post Office & Courthouse',
    destinationCoords: [33.4253, -94.0430]
  },
  {
    id: 'agent-scout-02',
    name: 'Scout-02 Aerial Drone',
    callsign: 'SCOUT-AERO',
    type: 'surveillance_drone',
    status: 'idle',
    battery: 88,
    speedMph: 0,
    altitudeM: 45,
    currentCoords: [33.4735, -94.1165],
    headingDeg: 120,
    signalRssi: -56,
    autonomyLevel: 'L5 Full Autonomous',
    avatarColor: '#8b5cf6',
    assignedDestination: 'TAMU-Texarkana Testbed',
    destinationCoords: [33.4735, -94.1165]
  },
  {
    id: 'agent-transit-03',
    name: 'Transit-03 Urban Shuttle',
    callsign: 'TX-SHUTTLE',
    type: 'transit_shuttle',
    status: 'idle',
    battery: 79,
    speedMph: 0,
    altitudeM: 2.1,
    currentCoords: [33.4253, -94.0430],
    headingDeg: 270,
    signalRssi: -52,
    autonomyLevel: 'L4 High',
    avatarColor: '#059669',
    assignedDestination: 'Historic Perot Theatre',
    destinationCoords: [33.4222, -94.0433]
  }
];

/**
 * Generates realistic interpolated path waypoints with smooth bezier-like curvatures
 */
export function generateRoutePoints(
  start: [number, number],
  end: [number, number],
  steps: number = 70
): [number, number][] {
  const points: [number, number][] = [];
  const midLat = (start[0] + end[0]) / 2;
  const midLng = (start[1] + end[1]) / 2;
  
  // Deterministic perpendicular road bend for natural highway / street routing feel
  const deltaLat = end[0] - start[0];
  const deltaLng = end[1] - start[1];
  const bendFactor = 0.15;
  const ctrlLat = midLat - deltaLng * bendFactor;
  const ctrlLng = midLng + deltaLat * bendFactor;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic Bezier interpolation
    const lat = Math.pow(1 - t, 2) * start[0] + 2 * (1 - t) * t * ctrlLat + Math.pow(t, 2) * end[0];
    const lng = Math.pow(1 - t, 2) * start[1] + 2 * (1 - t) * t * ctrlLng + Math.pow(t, 2) * end[1];
    points.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }
  return points;
}

/**
 * Calculates distance in miles between coordinates
 */
export function calculateDistanceMiles(coord1: [number, number], coord2: [number, number]): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const dLng = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1[0] * Math.PI) / 180) *
      Math.cos((coord2[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Calculates compass heading bearing between two points
 */
export function calculateBearingDeg(from: [number, number], to: [number, number]): number {
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const dLng = ((to[1] - from[1]) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((brng + 360) % 360);
}

/**
 * Check if a coordinate is inside a polygon geofence (Ray-casting algorithm)
 */
export function isPointInsidePolygon(point: [number, number], polygon: [number, number][]): boolean {
  let inside = false;
  const x = point[0];
  const y = point[1];

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function findCurrentGeofence(point: [number, number]): GeofenceZone | null {
  for (const zone of GEOFENCE_ZONES) {
    if (isPointInsidePolygon(point, zone.coordinates)) {
      return zone;
    }
  }
  return null;
}

/**
 * Check if a coordinate is inside or close to a polygon geofence (with safety buffer)
 */
export function isPointInsideOrNearPolygon(
  point: [number, number],
  polygon: [number, number][],
  bufferDeg: number = 0.0018
): boolean {
  if (isPointInsidePolygon(point, polygon)) return true;

  for (const vertex of polygon) {
    const dLat = Math.abs(point[0] - vertex[0]);
    const dLng = Math.abs(point[1] - vertex[1]);
    if (dLat < bufferDeg && dLng < bufferDeg) {
      return true;
    }
  }
  return false;
}

/**
 * Scans path waypoints starting from currentIndex to detect if upcoming trajectory penetrates a hazardous geofence
 */
export function detectHazardOnPath(
  waypoints: [number, number][],
  currentIndex: number,
  hazardZone: GeofenceZone
): {
  hasHazard: boolean;
  hazardIndex: number;
  hazardPoint: [number, number] | null;
  distanceToHazardMiles: number;
} {
  for (let i = currentIndex; i < waypoints.length; i++) {
    const pt = waypoints[i];
    if (isPointInsideOrNearPolygon(pt, hazardZone.coordinates, 0.002)) {
      const dist = calculateDistanceMiles(waypoints[currentIndex], pt);
      return {
        hasHazard: true,
        hazardIndex: i,
        hazardPoint: pt,
        distanceToHazardMiles: dist,
      };
    }
  }
  return {
    hasHazard: false,
    hazardIndex: -1,
    hazardPoint: null,
    distanceToHazardMiles: Infinity,
  };
}

/**
 * Calculates a smooth, safe evasion bypass trajectory around a hazardous zone
 */
export function generateHazardEvasionRoute(
  start: [number, number],
  end: [number, number],
  hazardZone: GeofenceZone,
  steps: number = 180
): [number, number][] {
  // Compute hazard bounding box and centroid
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;
  let sumLat = 0;
  let sumLng = 0;
  const count = hazardZone.coordinates.length;

  for (const [lat, lng] of hazardZone.coordinates) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    sumLat += lat;
    sumLng += lng;
  }

  const centerLat = sumLat / count;
  const centerLng = sumLng / count;

  // Determine evasion offset direction (West detour vs East detour)
  const avgLng = (start[1] + end[1]) / 2;
  const evadeWest = avgLng <= centerLng;

  // Generous safety clearance margin (0.012 deg ≈ 0.8 mile clearance buffer outside hazard edge)
  const clearanceLat = (maxLat - minLat) * 0.15 + 0.006;
  const clearanceLng = (maxLng - minLng) * 0.28 + 0.012;

  const bypassWaypoint1: [number, number] = [
    Number((centerLat - clearanceLat).toFixed(6)),
    Number((evadeWest ? minLng - clearanceLng : maxLng + clearanceLng).toFixed(6)),
  ];

  const bypassWaypoint2: [number, number] = [
    Number((centerLat + clearanceLat).toFixed(6)),
    Number((evadeWest ? minLng - clearanceLng : maxLng + clearanceLng).toFixed(6)),
  ];

  // If start is north of center, reverse bypass points to ensure natural progression
  const orderedBypass = start[0] > centerLat 
    ? [bypassWaypoint2, bypassWaypoint1] 
    : [bypassWaypoint1, bypassWaypoint2];

  // Generate multi-segment smooth trajectory:
  const seg1Steps = Math.floor(steps / 3);
  const seg2Steps = Math.floor(steps / 3);
  const seg3Steps = steps - seg1Steps - seg2Steps;

  const seg1 = generateRoutePoints(start, orderedBypass[0], seg1Steps);
  const seg2 = generateRoutePoints(orderedBypass[0], orderedBypass[1], seg2Steps).slice(1);
  const seg3 = generateRoutePoints(orderedBypass[1], end, seg3Steps).slice(1);

  return [...seg1, ...seg2, ...seg3];
}
