import { NextRequest, NextResponse } from 'next/server';
import { getPromptAlert } from '@/lib/prompt-guardrails';
import { randomUUID } from 'node:crypto';

export const dynamic = 'force-dynamic';

function backendUrl(): string {
  const baseUrl =
    process.env.CIVICPATH_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:5000';
  return `${baseUrl.replace(/\/$/, '')}/api/query`;
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const startedAt = Date.now();
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
    const promptAlert = getPromptAlert(query, municipalitySlug);
    if (promptAlert) {
      return NextResponse.json({ error: { code: 'CLARIFICATION_REQUIRED', message: promptAlert } }, { status: 422 });
    }
    const response = await fetch(backendUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, municipalitySlug }),
      cache: 'no-store',
      signal: AbortSignal.timeout(90_000),
    });
    const payload = await response.json();
    if (!response.ok) {
      const code = payload.error?.code || 'CIVIC_SERVICE_UNAVAILABLE';
      const insufficientEvidence = /INSUFFICIENT_EVIDENCE|NO_RELIABLE_SOURCES|NO_RELEVANT_SOURCE_CONTENT/.test(
        `${code} ${payload.error?.message || ''}`
      );
      console.error('Roadmap generation service rejected request', {
        requestId, code, status: response.status, durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({ error: {
        requestId,
        code: insufficientEvidence ? 'NO_RELIABLE_SOURCES' : code,
        message: insufficientEvidence
          ? 'We could not find enough official instructions for this task in your city. Try a more specific task or browse the sample roadmaps.'
          : response.status === 504
            ? 'The roadmap service took too long to respond. Please try again.'
          : response.status >= 500
            ? 'The roadmap service is temporarily unavailable. Please try again shortly.'
            : payload.error?.message || 'Check your task and service city, then try again.',
      } }, { status: insufficientEvidence ? 422 : response.status });
    }
    if (!payload?.workflow?.id) {
      throw new SyntaxError('Missing workflow in service response');
    }
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    const timedOut = errorName === 'TimeoutError' || errorName === 'AbortError';
    const invalidResponse = errorName === 'SyntaxError';
    const code = timedOut ? 'CIVIC_SERVICE_TIMEOUT'
      : invalidResponse ? 'INVALID_SERVICE_RESPONSE' : 'CIVIC_SERVICE_UNAVAILABLE';
    console.error('Roadmap generation request failed', {
      requestId, code, errorName, durationMs: Date.now() - startedAt,
      causeCode: error instanceof Error && error.cause && typeof error.cause === 'object' && 'code' in error.cause
        ? error.cause.code : undefined,
    });
    return NextResponse.json(
      {
        error: {
          code,
          requestId,
          message: timedOut
            ? 'Building your roadmap is taking longer than expected. Please try again; it may already be ready.'
            : invalidResponse
              ? 'The roadmap service returned an incomplete response. Please try again.'
              : 'We could not connect to the roadmap service. Please try again shortly.',
        },
      },
      { status: timedOut ? 504 : invalidResponse ? 502 : 503 }
    );
  }
}
