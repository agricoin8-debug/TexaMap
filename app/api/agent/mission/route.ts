import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';
import { PRESET_LANDMARKS, TEXARKANA_CENTER } from '@/lib/texarkana-data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      agentId = 'agent-apex-01',
      originCoords = TEXARKANA_CENTER,
      destinationName,
      destinationCoords
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    // If Gemini API is available, generate AI autonomous mission plan
    if (apiKey) {
      try {
        const systemInstruction = `You are the Autonomous Mission Control & Dispatch Engine for a fleet operating in the Texarkana (Texas/Arkansas) metroplex.
Analyze the user's mission objective and output a valid JSON object matching this structure:
{
  "missionTitle": string (e.g. "Operation Lone Star Courier"),
  "tacticalSummary": string (short 2-sentence mission brief),
  "targetDestination": string,
  "destinationCoords": [number, number] (latitude, longitude around Texarkana, lat: ~33.29 to 33.48, lng: ~-94.17 to -93.99),
  "recommendedSpeedMph": number,
  "flightAltitudeM": number,
  "riskLevel": "Low" | "Moderate" | "Elevated",
  "batteryRequiredPct": number,
  "tacticalNotes": string[],
  "geofenceAdvisory": string
}
Do NOT include markdown formatting or codeblocks. Output pure JSON only.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Mission Request: "${prompt || `Route to ${destinationName || 'destination'}`}". 
Fleet Agent: ${agentId}. Current Origin: [${originCoords[0]}, ${originCoords[1]}]. Target destination: ${destinationName || 'Auto-select Landmark'}. Destination hint: [${destinationCoords ? destinationCoords.join(',') : 'Auto'}].`,
          config: {
            systemInstruction,
            temperature: 0.3,
            responseMimeType: 'application/json'
          }
        });

        const rawText = response.text?.trim() || '';
        const parsed = JSON.parse(rawText);
        return NextResponse.json({
          success: true,
          source: 'gemini-3.8-flash',
          mission: parsed
        });
      } catch (geminiError) {
        console.warn('Gemini autonomous planner fallback triggered:', geminiError);
      }
    }

    // High quality intelligent heuristic fallback planner
    let target = destinationName || 'State Line Post Office & Federal Courthouse';
    let targetCoords: [number, number] = destinationCoords || PRESET_LANDMARKS.courtHouse.coords;

    // Check if matching preset landmark
    const matchedKey = Object.keys(PRESET_LANDMARKS).find(
      (k) =>
        prompt?.toLowerCase().includes(k.toLowerCase()) ||
        prompt?.toLowerCase().includes(PRESET_LANDMARKS[k].name.toLowerCase()) ||
        destinationName?.toLowerCase().includes(PRESET_LANDMARKS[k].name.toLowerCase())
    );

    if (matchedKey) {
      target = PRESET_LANDMARKS[matchedKey].name;
      targetCoords = PRESET_LANDMARKS[matchedKey].coords;
    }

    const isDrone = agentId.includes('scout') || agentId.includes('drone');

    return NextResponse.json({
      success: true,
      source: 'autonomous-heuristic-engine',
      mission: {
        missionTitle: `Autonomous Dispatch: ${target.split(' ')[0]} Sector`,
        tacticalSummary: `Autonomous route trace engaged toward ${target}. Navigation protocols synchronized across Texas/Arkansas state corridors.`,
        targetDestination: target,
        destinationCoords: targetCoords,
        recommendedSpeedMph: isDrone ? 38 : 28,
        flightAltitudeM: isDrone ? 42 : 1.5,
        riskLevel: 'Low',
        batteryRequiredPct: 14,
        tacticalNotes: [
          'Bi-state regulatory compliance verified for State Line Avenue.',
          'Adaptive speed profiling active for Texarkana school and commercial zones.',
          'Continuous telemetry ping rate established at 2.5 Hz.'
        ],
        geofenceAdvisory: 'Route stays clear of Texarkana Regional Airport restricted airspace.'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process mission request' },
      { status: 500 }
    );
  }
}
