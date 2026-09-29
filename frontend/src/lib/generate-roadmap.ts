interface GenerationRequest {
  query: string;
  municipalitySlug: string;
}

export async function generateRoadmap(input: GenerationRequest, onRetry: () => void): Promise<string> {
  void onRetry;
  try {
    const response = await fetch('/api/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(95_000),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message || 'The roadmap service is temporarily unavailable. Please try again shortly.');
    }
    if (typeof payload?.workflow?.id !== 'string' || !payload.workflow.id) {
      throw new SyntaxError('The roadmap service returned an incomplete response. Please try again.');
    }
    return payload.workflow.id;
  } catch (error) {
    const timeout = error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name);
    const connectionFailure = error instanceof TypeError;
    const invalidResponse = error instanceof SyntaxError;
    if (timeout) throw new Error('Building your roadmap is taking longer than expected. Please try again; it may already be ready.');
    if (connectionFailure) throw new Error('We could not connect to the roadmap service. Check your connection and try again.');
    if (invalidResponse) throw new Error('The roadmap service returned an incomplete response. Please try again.');
    throw error;
  }
}
