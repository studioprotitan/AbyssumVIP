import { NextRequest, NextResponse } from 'next/server';

const GITHUB_RELEASE_BASE = 'https://github.com/studioprotitan/AbyssumVIP/releases/download/assets-v1';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const assetName = path.join('/');
  const upstream = `${GITHUB_RELEASE_BASE}/${assetName}`;

  const response = await fetch(upstream);
  if (!response.ok) {
    return NextResponse.json({ error: 'Asset not found', asset: assetName }, { status: 404 });
  }

  const buffer = await response.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'model/gltf-binary',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}