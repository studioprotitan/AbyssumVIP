import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GITHUB_RELEASE_BASE = 'https://github.com/studioprotitan/Forge-Avatars/releases/download/v1.0';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const assetName = path.join('/');
  const upstream = `${GITHUB_RELEASE_BASE}/${assetName}`;

  const response = await fetch(upstream, { redirect: 'follow' });

  if (!response.ok) {
    return NextResponse.json({ error: 'Asset not found', asset: assetName }, { status: 404 });
  }

  const contentType = assetName.endsWith('.babylon')
    ? 'application/octet-stream'
    : assetName.endsWith('.glb')
    ? 'model/gltf-binary'
    : 'application/octet-stream';

  return new NextResponse(response.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
