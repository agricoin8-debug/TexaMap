import { NextResponse } from 'next/server';

type TileRouteContext = {
  params: Promise<{ style: string; z: string; x: string; y: string }>;
};

const styles = {
  voyager: 'rastertiles/voyager',
  dark: 'dark_all',
} as const;

function isTileCoordinate(value: string, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= max;
}

export async function GET(_request: Request, { params }: TileRouteContext) {
  const { style, z, x, y } = await params;
  const layer = styles[style as keyof typeof styles];
  const zoom = Number(z);

  if (!layer || !Number.isInteger(zoom) || zoom < 0 || zoom > 19) {
    return new NextResponse('Invalid tile request', { status: 400 });
  }

  const tileLimit = 2 ** zoom - 1;
  if (!isTileCoordinate(x, tileLimit) || !isTileCoordinate(y, tileLimit)) {
    return new NextResponse('Invalid tile request', { status: 400 });
  }

  const apiKey = process.env.CARTO_basemap_api;
  if (!apiKey) {
    return new NextResponse('Map service is not configured', { status: 503 });
  }

  const upstream = `https://a.basemaps.cartocdn.com/${layer}/${zoom}/${x}/${y}.png?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(upstream, { next: { revalidate: 3600 } });

  if (!response.ok) {
    return new NextResponse('Map tile unavailable', { status: response.status });
  }

  return new NextResponse(await response.arrayBuffer(), {
    headers: {
      'Content-Type': response.headers.get('content-type') || 'image/png',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
