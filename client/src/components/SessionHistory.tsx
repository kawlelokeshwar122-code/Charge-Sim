import React, { useEffect, useState } from 'react';
import './SessionHistory.css';

interface Session {
  id: number;
  bay: string;
  car: string;
  kwhAdded: number;
  costInr: number;
  durationMin: number | null;
  finishedAt: string;
}

function fmtDuration(min: number | null): string {
  if (min == null || !isFinite(min)) return '—';
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  const s = Math.floor((min * 60) % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short',
  });
}

export default function SessionHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/sessions')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Session[]>;
      })
      .then(data => { setSessions(data); setLoading(false); })
      .catch(err => { setError(String(err)); setLoading(false); });
  }, []);

  return (
    <section className="history-section">
      <h2 className="history-title">📋 Session History</h2>

      {loading && <p className="history-msg">Loading…</p>}
      {error   && <p className="history-msg history-error">⚠ Could not load sessions — is the API server running?</p>}

      {!loading && !error && sessions.length === 0 && (
        <p className="history-msg">No sessions yet. Plug in a car and complete a charge to see records here.</p>
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Bay</th>
                <th>Car</th>
                <th>kWh</th>
                <th>Cost</th>
                <th>Duration</th>
                <th>Finished</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td><span className="bay-tag">{s.bay}</span></td>
                  <td className="car-cell">{s.car}</td>
                  <td>{s.kwhAdded.toFixed(2)}</td>
                  <td>₹{s.costInr.toFixed(2)}</td>
                  <td>{fmtDuration(s.durationMin)}</td>
                  <td className="date-cell">{fmtDate(s.finishedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
