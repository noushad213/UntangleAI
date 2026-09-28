import Link from 'next/link';
import { verifyWorkflow } from './actions';
import styles from './page.module.css';

interface Municipality {
  _id: string;
  name: string;
  slug: string;
}

interface WorkflowSummary {
  _id: string;
  issueKey: string;
  title: string;
  status: 'needs_review' | 'verified' | 'outdated';
  updatedAt: string;
}

function backendUrl(path: string): string {
  const baseUrl =
    process.env.CIVICPATH_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:5000';
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

async function loadReviewQueue() {
  const municipalityResponse = await fetch(backendUrl('/api/municipalities'), {
    cache: 'no-store',
  });
  if (!municipalityResponse.ok) throw new Error('Could not load municipalities.');

  const municipalityPayload = (await municipalityResponse.json()) as {
    municipalities: Municipality[];
  };

  const groups = await Promise.all(
    municipalityPayload.municipalities.map(async (municipality) => {
      const response = await fetch(
        backendUrl(`/api/workflows/municipality/${encodeURIComponent(municipality._id)}`),
        { cache: 'no-store' }
      );
      if (!response.ok) return { municipality, workflows: [] as WorkflowSummary[] };
      const payload = (await response.json()) as { workflows: WorkflowSummary[] };
      return { municipality, workflows: payload.workflows };
    })
  );

  return groups;
}

export default async function AdminPage() {
  let groups: Awaited<ReturnType<typeof loadReviewQueue>> = [];
  let errorMessage = '';

  try {
    groups = await loadReviewQueue();
  } catch {
    errorMessage = 'The review queue is unavailable. Check the backend connection and refresh.';
  }

  const workflowCount = groups.reduce((total, group) => total + group.workflows.length, 0);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Restricted reviewer area</p>
          <h1>Civic workflow review</h1>
          <p>Inspect generated guidance before marking it as reviewed.</p>
        </div>
        <Link href="/" className={styles.homeLink}>Citizen site</Link>
      </header>

      {errorMessage ? (
        <section className={styles.errorState} role="alert">
          <h2>Could not load review data</h2>
          <p>{errorMessage}</p>
        </section>
      ) : workflowCount === 0 ? (
        <section className={styles.emptyState}>
          <h2>No workflows are waiting</h2>
          <p>Generated workflows will appear here after citizens submit supported tasks.</p>
        </section>
      ) : (
        <div className={styles.groups}>
          {groups.map(({ municipality, workflows }) => (
            <section key={municipality._id} className={styles.group}>
              <div className={styles.groupHeader}>
                <h2>{municipality.name}</h2>
                <span>{workflows.length} workflow(s)</span>
              </div>
              <div className={styles.tableWrapper}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Workflow</th>
                      <th scope="col">Status</th>
                      <th scope="col">Updated</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workflows.map((workflow) => (
                      <tr key={workflow._id}>
                        <td>
                          <strong>{workflow.title}</strong>
                          <span>{workflow.issueKey}</span>
                        </td>
                        <td><span className={styles.status}>{workflow.status.replace('_', ' ')}</span></td>
                        <td>{new Date(workflow.updatedAt).toLocaleDateString('en-IN')}</td>
                        <td className={styles.actions}>
                          <Link href={`/roadmap/${workflow._id}`}>Inspect</Link>
                          {workflow.status !== 'verified' && (
                            <form action={verifyWorkflow}>
                              <input type="hidden" name="workflowId" value={workflow._id} />
                              <button type="submit">Mark reviewed</button>
                            </form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
