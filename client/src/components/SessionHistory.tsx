import { useEffect, useState } from 'react';
import BrandBadge from './BrandBadge';
import './SessionHistory.css';

interface Session {
  id: number;
  bay: string;
  car: string;
  kwhAdded: number;
  costInr: number;
  durationMin: number | null;
  finishedAt: string;
  paid: boolean;
  paymentId: string | null;
  prepaid?: boolean;
  amountPaid?: number | null;
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
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function SessionHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/sessions')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Session[]>;
      })
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

  return (
    <section className="history-section">
      <div className="history-header">
        <h2 className="history-title">📋 Charging Session History</h2>
        <span className="history-count">{sessions.length} recorded</span>
      </div>

      {loading && <p className="history-msg">Loading session logs…</p>}
      {error && <p className="history-msg history-error">⚠ Could not load sessions from API</p>}

      {!loading && !error && sessions.length === 0 && (
        <p className="history-msg">No charging sessions yet. Connect an EV and complete a prepaid charge.</p>
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Bay</th>
                <th>Vehicle</th>
                <th>Energy</th>
                <th>Cost</th>
                <th>Duration</th>
                <th>Payment Status</th>
                <th>Completed Time</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const displayAmt = (s.amountPaid != null ? s.amountPaid : s.costInr).toFixed(2);
                return (
                  <tr key={s.id}>
                    <td><span className="bay-tag">{s.bay}</span></td>
                    <td className="car-cell">
                      <BrandBadge carName={s.car} size="sm" />
                      <span className="car-cell-name">{s.car}</span>
                    </td>
                    <td className="num-cell">{s.kwhAdded.toFixed(2)} kWh</td>
                    <td className="num-cell">₹{s.costInr.toFixed(2)}</td>
                    <td>{fmtDuration(s.durationMin)}</td>
                    <td>
                      <span className={`paid-badge ${s.paid ? (s.prepaid ? 'is-prepaid' : 'is-paid') : 'is-unpaid'}`}>
                        {s.paid
                          ? (s.prepaid ? `✅ Prepaid ₹${displayAmt}` : `✅ Paid ₹${displayAmt}`)
                          : '❌ Unpaid'}
                      </span>
                    </td>
                    <td className="date-cell">{fmtDate(s.finishedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
