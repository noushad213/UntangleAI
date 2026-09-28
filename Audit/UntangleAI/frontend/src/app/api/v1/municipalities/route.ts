import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.CIVICPATH_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/api/municipalities`, {
      cache: 'no-store', signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error('Municipalities unavailable');
    const payload = await response.json();
    return NextResponse.json({ municipalities: payload.municipalities });
  } catch {
    return NextResponse.json({ municipalities: [], error: 'City list is unavailable. Retry shortly.' }, { status: 503 });
  }
}
