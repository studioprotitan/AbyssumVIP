import { NextRequest, NextResponse } from 'next/server';

const CDN_BASE = 'https://github.com/studioprotitan/AbyssumVIP/releases/download';

export async function GET(req: NextRequest) {
  const assetName = req.nextUrl.pathname.replace('/api/asset/', '');
  const upstream = `${CDN_BASE}/assets/${assetName}`;

  const response = await fetch(upstream);
  if (!response.ok) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  const buffer = await response.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'model/gltf-binary',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}