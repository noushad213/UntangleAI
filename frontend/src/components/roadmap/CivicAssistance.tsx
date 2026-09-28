'use client';

import { useRef, useState } from 'react';
import { ProcessStep } from '@/types/roadmap';
import { buildCoverLetter, getCivicHelpline, safeWebUrl } from '@/lib/civic-assistance';
import styles from './CivicAssistance.module.css';

interface Props { step: ProcessStep; location: string }
interface OfficeMatch { name: string; address: string; coordinates: { lat: number; lng: number }; navigationUrl: string }

export function CivicAssistance({ step, location }: Props) {
  const [query, setQuery] = useState([step.office, step.officeLocation || location].filter(Boolean).join(', ').slice(0, 300));
  const [city, setCity] = useState('');
  const [matches, setMatches] = useState<OfficeMatch[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState('');
  const requestId = useRef(0);
  const helpline = getCivicHelpline(city);
  const sourceUrl = safeWebUrl(step.sourceUrl);

  async function lookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = ++requestId.current;
    setBusy(true); setError(''); setMatches(null);
    try {
      const response = await fetch('/api/v1/offices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }), signal: AbortSignal.timeout(10000),
      });
      const payload = await response.json();
      if (id !== requestId.current) return;
      if (!response.ok) throw new Error(payload.error?.message || 'Office lookup failed. Try again.');
      setMatches(payload.matches);
    } catch (cause) {
      if (id === requestId.current) setError(cause instanceof Error ? cause.message : 'Office lookup failed. Try again.');
    } finally { if (id === requestId.current) setBusy(false); }
  }

  function generateDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setDraft(buildCoverLetter(step, location, {
      name: String(fields.get('name') || ''), address: String(fields.get('address') || ''), phone: String(fields.get('phone') || ''),
    }));
  }

  function downloadDraft() {
    const url = URL.createObjectURL(new Blob([draft], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'application-cover-letter.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className={styles.assistance} aria-label="Forms, office maps and helplines" lang="en" dir="ltr">
      <details>
        <summary>Find the service office</summary>
        <form onSubmit={lookup} className={styles.form}>
          <label htmlFor="office-query">Office name and city</label>
          <input id="office-query" value={query} maxLength={300} required onChange={(event) => {
            setQuery(event.target.value); ++requestId.current; setBusy(false); setMatches(null); setError('');
          }} aria-describedby="office-privacy" />
          <p id="office-privacy">Search public office details only. This lookup sends your search to OpenStreetMap.</p>
          <button type="submit" disabled={busy}>{busy ? 'Finding offices…' : 'Find office on map'}</button>
        </form>
        {error && <p role="alert">{error}</p>}
        {matches && <div role="status">
          <p>{matches.length ? 'Map matches. Confirm the office serves your area before visiting.' : 'No office match found. Add the office address or check the official service page.'}</p>
          {matches.map((office) => <p key={`${office.coordinates.lat},${office.coordinates.lng}`}>
            <strong>{office.name}</strong><br />{office.address}<br />
            <a href={safeWebUrl(office.navigationUrl)} target="_blank" rel="noopener noreferrer">Open directions</a>
          </p>)}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>
        </div>}
      </details>
      <details>
        <summary>Forms and cover letter</summary>
        {sourceUrl && <p><a href={sourceUrl} target="_blank" rel="noopener noreferrer">Find the prescribed form on the official service page</a></p>}
        {step.requirements.filter((req) => safeWebUrl(req.downloadUrl)).map((req) => <p key={req.id}>
          <a href={safeWebUrl(req.downloadUrl)} target="_blank" rel="noopener noreferrer">Download {req.title}</a>
        </p>)}
        <p>Prepare a cover letter for this step. Your details stay in this browser and are cleared when you change steps.</p>
        <form onSubmit={generateDraft} onChange={() => setDraft('')} className={styles.form}>
          <label htmlFor="applicant-name">Applicant name (optional)</label>
          <input id="applicant-name" name="name" autoComplete="name" maxLength={150} />
          <label htmlFor="applicant-address">Address (optional)</label>
          <textarea id="applicant-address" name="address" autoComplete="street-address" maxLength={500} rows={3} />
          <label htmlFor="applicant-phone">Phone (optional)</label>
          <input id="applicant-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} />
          <button type="submit">Prepare cover letter</button>
        </form>
        {draft && <div className={styles.form}>
          <label htmlFor="letter-draft">Review and edit your draft</label>
          <textarea id="letter-draft" value={draft} onChange={(event) => setDraft(event.target.value)} rows={12} />
          <button type="button" onClick={downloadDraft}>Download cover letter (.txt)</button>
        </div>}
      </details>
      <details>
        <summary>Civic helplines</summary>
        <div className={styles.form}>
          <label htmlFor="helpline-city">Municipal authority</label>
          <select id="helpline-city" value={city} onChange={(event) => setCity(event.target.value)}>
            <option value="">Choose the authority serving your area</option>
            <option value="mumbai">Mumbai — BMC</option>
            <option value="pune">Pune — PMC</option>
            <option value="nagpur">Nagpur — NMC</option>
            <option value="delhi">Delhi — MCD</option>
            <option value="bengaluru">Bengaluru — GBA</option>
          </select>
          {helpline ? <p>{helpline.authority}: <a href={`tel:${helpline.phone}`}>{helpline.phone}</a><br />
            <a href={helpline.sourceUrl} target="_blank" rel="noopener noreferrer">Check contact details on the official website</a>
          </p> : <p>For other authorities, check the contact page on the official service website.</p>}
          <p>Directory checked on 28 September 2026. Confirm contact details before calling.</p>
        </div>
      </details>
    </section>
  );
}
