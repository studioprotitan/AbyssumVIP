import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const assetName = req.nextUrl.pathname.replace('/api/asset/', '');
  const upstream = `https://github.com/studioprotitan/AbyssumVIP/releases/download/assets-v1/${assetName}`;

  try {
    const response = await fetch(upstream, {
      redirect: 'follow',
      headers: { 'User-Agent': 'AbyssumVIP-Proxy/1.0' },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Asset not found', status: response.status, upstream }, { status: 404 });
    }

    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err), upstream }, { status: 500 });
  }
}