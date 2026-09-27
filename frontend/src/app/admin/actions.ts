'use server';

import { revalidatePath } from 'next/cache';

function backendUrl(path: string): string {
  const baseUrl =
    process.env.CIVICPATH_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:5000';
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

export async function verifyWorkflow(formData: FormData) {
  const workflowId = formData.get('workflowId');
  if (typeof workflowId !== 'string' || !/^[a-f\d]{24}$/i.test(workflowId)) {
    throw new Error('Invalid workflow ID.');
  }

  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken) throw new Error('Backend administrator access is not configured.');

  const response = await fetch(backendUrl(`/api/workflows/${workflowId}/verify`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
    cache: 'no-store',
  });

  if (!response.ok) throw new Error('The workflow could not be verified.');
  revalidatePath('/admin');
}
