import React from 'react';
import type { BayState } from '../types';
import { calcLiveKw, fmtTime, fmtKwh, fmtInr, TARIFF_INR_PER_KWH } from '../utils';
import './BayCard.css';

interface Props {
  bay: BayState;
  onPlugIn: () => void;
  onStart: () => void;
  onStop: () => void;
  onUnplug: () => void;
}

export default function BayCard({ bay, onPlugIn, onStart, onStop, onUnplug }: Props) {
  const { phase, car, soc, kwhAdded, costInr, liveKw } = bay;

  // Time left to reach 100%
  const timeLeftMin = React.useMemo(() => {
    if (!car || phase !== 'charging' || liveKw <= 0) return null;
    const kwhRemaining = (car.batterySizeKwh * (100 - soc)) / 100;
    return (kwhRemaining / liveKw) * 60;
  }, [car, phase, soc, liveKw]);

  const socBarColor = soc >= 80 ? '#f39c12' : soc >= 50 ? '#2ecc71' : '#3498db';

  return (
    <div className={`bay-card bay-${phase}`}>
      {/* Bay header */}
      <div className="bay-header">
        <div className="bay-title">
          <span className="bay-icon">{bay.maxKw >= 50 ? '⚡' : '🔌'}</span>
          <div>
            <div className="bay-name">{bay.label}</div>
            <div className="bay-max-kw">{bay.maxKw} kW {bay.maxKw >= 50 ? 'DC' : 'AC'}</div>
          </div>
        </div>
        <div className={`bay-status-pill status-${phase}`}>
          {phase === 'idle' ? 'Available'
            : phase === 'plugged' ? 'Car Plugged'
            : phase === 'charging' ? 'Charging'
            : 'Session Done'}
        </div>
      </div>

      {/* Car info */}
      {car && (
        <div className="car-info">
          <div className="car-dot" style={{ background: car.color }} />
          <div>
            <div className="car-name">{car.name}</div>
            <div className="car-spec">{car.batterySizeKwh} kWh battery · max {car.maxChargeKw} kW</div>
          </div>
        </div>
      )}

      {/* Metrics */}
      {car && (
        <>
          {/* SOC bar */}
          <div className="soc-section">
            <div className="soc-row">
              <span className="soc-label">Battery</span>
              <span className="soc-pct">{soc.toFixed(1)}%</span>
            </div>
            <div className="soc-track">
              <div
                className="soc-fill"
                style={{ width: `${soc}%`, background: socBarColor }}
              />
            </div>
          </div>

          {/* Live stats grid */}
          <div className="stats-grid">
            <div className="stat-cell">
              <div className="stat-val">{phase === 'charging' ? liveKw.toFixed(1) : '0.0'} kW</div>
              <div className="stat-lbl">Live Power</div>
            </div>
            <div className="stat-cell">
              <div className="stat-val">{fmtKwh(kwhAdded)}</div>
              <div className="stat-lbl">kWh Added</div>
            </div>
            <div className="stat-cell">
              <div className="stat-val">{fmtInr(costInr)}</div>
              <div className="stat-lbl">Cost (@₹{TARIFF_INR_PER_KWH}/kWh)</div>
            </div>
            <div className="stat-cell">
              <div className="stat-val">
                {phase === 'charging' ? fmtTime(timeLeftMin ?? 0) : '—'}
              </div>
              <div className="stat-lbl">Time Left</div>
            </div>
          </div>
        </>
      )}

      {/* No car placeholder */}
      {!car && (
        <div className="no-car">
          <span className="no-car-icon">🚗</span>
          <span>No vehicle connected</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="bay-actions">
        {phase === 'idle' && (
          <button className="btn btn-blue" onClick={onPlugIn}>
            🔌 Plug In Car
          </button>
        )}
        {phase === 'plugged' && (
          <>
            <button className="btn btn-green" onClick={onStart}>
              ▶ Start Charging
            </button>
            <button className="btn btn-red" onClick={onUnplug}>
              ✖ Unplug
            </button>
          </>
        )}
        {phase === 'charging' && (
          <button className="btn btn-orange" onClick={onStop}>
            ⏹ Stop Charging
          </button>
        )}
        {phase === 'done' && (
          <button className="btn btn-red" onClick={onUnplug}>
            🚪 Unplug &amp; Reset
          </button>
        )}
      </div>
    </div>
  );
}
