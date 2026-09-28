import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let input: unknown;
  try { input = await request.json(); } catch {
    return NextResponse.json({ error: { message: 'Enter an office name and city.' } }, { status: 400 });
  }
  const query = input && typeof input === 'object' && 'query' in input ? input.query : null;
  if (typeof query !== 'string' || !query.trim() || query.length > 300) {
    return NextResponse.json({ error: { message: 'Enter an office name and city under 300 characters.' } }, { status: 400 });
  }
  const base = process.env.CIVICPATH_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/api/offices/lookup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }), cache: 'no-store', signal: AbortSignal.timeout(8000),
    });
    return NextResponse.json(await response.json(), { status: response.status, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: { message: 'Office maps are unavailable. Retry or open the official service page.' } }, { status: 503 });
  }
}
