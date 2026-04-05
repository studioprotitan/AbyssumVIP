import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  const filePath = params.path.join('/');
  const url = `https://github.com/studioprotitan/Forge-Avatars/releases/download/v1.0/${filePath}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return new NextResponse('Asset not found', { status: 404 });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('[PROXY:ERROR] Failed to fetch asset:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}