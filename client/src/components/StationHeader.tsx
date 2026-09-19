import React from 'react';
import type { StationTotals } from '../types';
import { fmtKwh, fmtInr } from '../utils';
import './StationHeader.css';

interface Props {
  totals: StationTotals;
  speed: number;
  onSpeedChange: (s: number) => void;
}

const SPEEDS = [1, 60, 600];

export default function StationHeader({ totals, speed, onSpeedChange }: Props) {
  return (
    <header className="station-header">
      <div className="station-title-row">
        <div className="station-title">
          <span className="station-logo">⚡</span>
          <div>
            <h1>Charge Station Simulator</h1>
            <p className="station-sub">2-Bay EV Charging Hub · IndiaGrid Demo</p>
          </div>
        </div>

        {/* Speed control */}
        <div className="speed-control">
          <span className="speed-label">Speed</span>
          <div className="speed-buttons">
            {SPEEDS.map(s => (
              <button
                key={s}
                className={`speed-btn ${speed === s ? 'active' : ''}`}
                onClick={() => onSpeedChange(s)}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="totals-bar">
        <div className="total-cell">
          <div className="total-val">{fmtKwh(totals.totalKwh)}</div>
          <div className="total-lbl">Total Delivered</div>
        </div>
        <div className="total-cell">
          <div className="total-val">{fmtInr(totals.totalRevenue)}</div>
          <div className="total-lbl">Revenue</div>
        </div>
        <div className="total-cell">
          <div className="total-val">{totals.carsCharging}</div>
          <div className="total-lbl">Charging Now</div>
        </div>
        <div className="total-cell">
          <div className="total-val">{totals.sessionsFinished}</div>
          <div className="total-lbl">Sessions Done</div>
        </div>
      </div>
    </header>
  );
}
