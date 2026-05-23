// nextapp/app/api/babylon/[file]/route.ts
//
// FORGE NETWORKS — Babylon Asset Proxy
// FIX-005 | 2026-05-23 | Next.js 15 async params
// Reviewed: Claude + Gemini Flash 3 Preview
// VLAAD: auditable, allowlisted, bandwidth-safe, no secrets
//
// STRUCTURE NOTE: This file MUST live at:
//   nextapp/app/api/babylon/[file]/route.ts
// NOT at:
//   nextapp/app/api/babylon/route.ts
// The [file] folder is the dynamic segment that captures the filename.

import { NextRequest, NextResponse } from 'next/server';

// ── CONFIG ────────────────────────────────────────────────────────────────────
// GitHub Release base URL — tag: repairbay-v1.0
// Served from Release assets, NOT repo tree — avoids LFS bandwidth charges.
// NOTE: No angle brackets — plain string URL only.
const ASSET_BASE_URL =
  'https://github.com/studioprotitan/AbyssumVIP/releases/download/repairbay-v1.0';

// ── ALLOWLIST ─────────────────────────────────────────────────────────────────
// ONLY files in this set can be proxied.
// Prevents this route from becoming an open proxy.
// Gemini note: keep this in sync with mi_manifest_dpk.json as assets are added.
const ALLOWED_FILES = new Set([
  // Babylon scene files
  'scene-osu-mint-deploy-cam-01-a.babylon',
  'scene-moai-osu-gemini-a.babylon',
  // GLB animation groups
  'cst-mint-deploy-mvp-animation-group-01.glb',
  // Forge Deck props — DPK confirmed
  'scene-mint-deploy-dpk-prop-clock-a.glb',
  'scene-mint-deploy-dpk-prop-banner-b.glb',
  'scene-mint-deploy-dpk-prop-billboard.glb',
  'scene-mint-deploy-dpk-prop-bus-stop.glb',
  'scene-mint-deploy-dpk-prop-postal-bo.glb',
  // Hype Stage
  'scene-hype-stage-idle-pre-mint.glb',
  'scene-mint-deploy-hype-stage-tunnel.glb',
]);

// ── MIME TYPE MAP ─────────────────────────────────────────────────────────────
// Gemini note: .babylon files are JSON structures, not binary.
// Use correct MIME per extension to prevent frontend parsing errors.
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'babylon': return 'application/json';          // Babylon scene JSON
    case 'glb':     return 'model/gltf-binary';         // Binary GLB
    case 'gltf':    return 'model/gltf+json';           // Text GLTF
    case 'bin':     return 'application/octet-stream';  // Binary buffer
    default:        return 'application/octet-stream';
  }
}

// ── CACHE CONTROL ─────────────────────────────────────────────────────────────
// CDN edge: 1hr cache, browser: 5min, stale-while-revalidate: 24hr
// This is the primary bandwidth fix — Vercel edge serves cached asset
// after first request, zeroing out repeated Fast Origin Transfer cost.
const CACHE_CONTROL =
  'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';

// ── GET HANDLER ───────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ file: string }> }
): Promise<NextResponse> {

  // FIX-005 core: await the params Promise (Next.js 15 requirement)
  const { file } = await context.params;

  console.log('[BABYLON-PROXY] GET request:', file);

  // Allowlist guard
  if (!ALLOWED_FILES.has(file)) {
    console.warn('[BABYLON-PROXY] Rejected (not in allowlist):', file);
    return new NextResponse('Not found', { status: 404 });
  }

  const upstreamUrl = `${ASSET_BASE_URL}/${encodeURIComponent(file)}`;
  console.log('[BABYLON-PROXY] Fetching upstream:', upstreamUrl);

  try {
    // Gemini note: pass through Range header for large file support.
    // Allows browser to resume interrupted downloads on 303MB babylon scenes.
    const rangeHeader = request.headers.get('range');
    const upstream = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'AbyssumVIP-ForgeProxy/1.0',
        ...(rangeHeader ? { Range: rangeHeader } : {}),
      },
      // Next.js fetch cache — revalidate every hour
      next: { revalidate: 3600 },
    });

    if (!upstream.ok && upstream.status !== 206) {
      console.error('[BABYLON-PROXY] Upstream HTTP error:', upstream.status, file);
      return new NextResponse('Upstream error', { status: upstream.status });
    }

    const body = await upstream.arrayBuffer();
    const mimeType = getMimeType(file);

    console.log('[BABYLON-PROXY] Serving:', file, '|', mimeType, '|', body.byteLength, 'bytes');

    return new NextResponse(body, {
      status: upstream.status === 206 ? 206 : 200,
      headers: {
        'Content-Type':                mimeType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Cache-Control':               CACHE_CONTROL,
        'X-Forge-Proxy':               'babylon-asset-v2',
        'X-Asset-File':                file,
        'X-Asset-Bytes':               String(body.byteLength),
      },
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown proxy error';
    console.error('[BABYLON-PROXY] Fetch failed:', msg);
    return new NextResponse('Proxy fetch error: ' + msg, { status: 502 });
  }
}

// ── HEAD HANDLER ──────────────────────────────────────────────────────────────
// Entropy Throttler pre-flight warm-up fires HEAD before scene load.
// Must return 200 with CORS headers.
export async function HEAD(
  _request: NextRequest,
  context: { params: Promise<{ file: string }> }
): Promise<NextResponse> {
  const { file } = await context.params;

  if (!ALLOWED_FILES.has(file)) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Cache-Control':                CACHE_CONTROL,
      'X-Forge-Proxy':                'babylon-asset-v2',
    },
  });
}

// ── OPTIONS HANDLER ───────────────────────────────────────────────────────────
// CORS pre-flight — required for Babylon.js XMLHttpRequest
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Access-Control-Max-Age':       '86400',
    },
  });
}
