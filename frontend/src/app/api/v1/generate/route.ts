import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function backendUrl(): string {
  const baseUrl =
    process.env.CIVICPATH_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:5000';
  return `${baseUrl.replace(/\/$/, '')}/api/query`;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'Request body must be valid JSON.' } },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'Enter a civic task to continue.' } },
      { status: 400 }
    );
  }

  const input = body as Record<string, unknown>;
  const query = typeof input.query === 'string' ? input.query.trim() : '';
  const municipalitySlug =
    typeof input.municipalitySlug === 'string' ? input.municipalitySlug.trim() : '';

  if (!query || query.length > 500 || !municipalitySlug) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_REQUEST',
          message: 'Enter a civic task under 500 characters and choose a municipality.',
        },
      },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(backendUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, municipalitySlug }),
      cache: 'no-store',
      signal: AbortSignal.timeout(90_000),
    });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'CIVIC_SERVICE_UNAVAILABLE',
          message: 'We could not build this roadmap right now. Try again shortly.',
        },
      },
      { status: 503 }
    );
  }
}
