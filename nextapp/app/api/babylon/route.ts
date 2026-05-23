import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { file: string } }
) {
  const file = params.file;
  const url = `https://github.com/studioprotitan/AbyssumVIP/releases/download/repairbay-v1.0/${file}`;
  
  const res = await fetch(url, { headers: { 'User-Agent': 'AbyssumVIP/1.0' } });
  
  if (!res.ok) {
    return new NextResponse('Not found', { status: 404 });
  }

  const buffer = await res.arrayBuffer();
  
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}