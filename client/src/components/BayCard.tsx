import { useMemo, useState } from 'react';
import type { BayState, Car } from '../types';
import { fmtTime, fmtKwh, fmtInr, INDIAN_EV_MODELS, createCar } from '../utils';
import BrandBadge from './BrandBadge';
import './BayCard.css';

interface Props {
  bay: BayState;
  onPlugIn: (bayId: number, car: Car) => void;
  onStop: () => void;
  onUnplug: () => void;
  onPrepay: (bayId: number, amount: number) => void;
}

export default function BayCard({ bay, onPlugIn, onStop, onUnplug, onPrepay }: Props) {
  const { phase, car, soc, kwhAdded, costInr, liveKw, budgetLimit, amountPaid } = bay;
  const [prepayAmount, setPrepayAmount] = useState<string>('500');
  const [selectedModelIdx, setSelectedModelIdx] = useState<number>(0);

  const selectedModel = INDIAN_EV_MODELS[selectedModelIdx] || INDIAN_EV_MODELS[0];

  const timeLeftMin = useMemo(() => {
    if (!car || phase !== 'charging' || liveKw <= 0) return null;
    const kwhRemaining = (car.batterySizeKwh * (100 - soc)) / 100;
    return (kwhRemaining / liveKw) * 60;
  }, [car, phase, soc, liveKw]);

  const handlePrepaySubmit = () => {
    const val = parseFloat(prepayAmount);
    if (isNaN(val) || val < 1) {
      alert('Please enter a valid prepaid amount of at least ₹1.00');
      return;
    }
    if (val > 100000) {
      alert('Prepaid amount cannot exceed ₹1,00,000');
      return;
    }
    onPrepay(bay.id, val);
  };

  const handlePlugInClick = () => {
    const newCar = createCar(selectedModel);
    onPlugIn(bay.id, newCar);
  };

  return (
    <div className={`bay-card bay-${phase}`}>
      {/* Bay Header */}
      <div className="bay-header">
        <div className="bay-title">
          <div className="bay-icon-wrapper">
            <span className="bay-icon">{bay.maxKw >= 50 ? '⚡' : '🔌'}</span>
          </div>
          <div>
            <div className="bay-name">{bay.label}</div>
            <div className="bay-max-kw">{bay.maxKw} kW {bay.maxKw >= 50 ? 'DC Fast Charger' : 'AC Standard'}</div>
          </div>
        </div>
        <div className={`bay-status-pill status-${phase}`}>
          <span className="status-dot"></span>
          {phase === 'idle' ? 'Available'
            : phase === 'plugged' ? 'Car Connected'
            : phase === 'charging' ? 'Charging'
            : 'Completed'}
        </div>
      </div>

      {/* Connected Car Info */}
      {car && (
        <div className="car-info">
          <BrandBadge carName={car.name} size="md" />
          <div className="car-details">
            <div className="car-name">{car.name}</div>
            <div className="car-spec">
              {car.batterySizeKwh} kWh battery · Max {car.maxChargeKw} kW intake
            </div>
          </div>
        </div>
      )}

      {/* Live Battery & Stats */}
      {car && (
        <>
          <div className="soc-section">
            <div className="soc-row">
              <span className="soc-label">State of Charge</span>
              <span className="soc-pct">{soc.toFixed(1)}%</span>
            </div>
            <div className="soc-track">
              <div
                className={`soc-fill ${phase === 'charging' ? 'is-charging-fill' : ''}`}
                style={{ width: `${soc}%` }}
              />
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-cell">
              <div className="stat-val">{phase === 'charging' ? liveKw.toFixed(1) : '0.0'} kW</div>
              <div className="stat-lbl">Live Intake</div>
            </div>
            <div className="stat-cell">
              <div className="stat-val">{fmtKwh(kwhAdded)}</div>
              <div className="stat-lbl">Energy Delivered</div>
            </div>
            <div className="stat-cell">
              <div className="stat-val">
                {fmtInr(costInr)}
                {budgetLimit != null ? ` / ₹${budgetLimit.toFixed(0)}` : ''}
              </div>
              <div className="stat-lbl">
                {budgetLimit != null ? 'Prepaid Budget' : 'Total Cost'}
              </div>
            </div>
            <div className="stat-cell">
              <div className="stat-val">{phase === 'charging' ? fmtTime(timeLeftMin ?? 0) : '—'}</div>
              <div className="stat-lbl">Est. Time Left</div>
            </div>
          </div>

          {phase === 'charging' && budgetLimit != null && (
            <div className="budget-banner">
              🎯 Prepaid Budget: <strong>₹{budgetLimit.toFixed(2)}</strong> (Auto-stops once energy matches budget)
            </div>
          )}

          {phase === 'done' && (
            <div className="payment-badge paid">
              ✅ Prepaid ₹{(amountPaid ?? budgetLimit ?? costInr).toFixed(2)} (Charging Completed)
            </div>
          )}
        </>
      )}

      {/* Idle State: Indian EV Selection Dropdown */}
      {!car && (
        <div className="car-select-container">
          <div className="car-select-header">
            <span className="car-select-title">Choose Vehicle to Connect:</span>
          </div>
          <div className="car-select-row">
            <BrandBadge carName={selectedModel.name} size="md" />
            <select
              className="car-dropdown"
              value={selectedModelIdx}
              onChange={(e) => setSelectedModelIdx(Number(e.target.value))}
            >
              {INDIAN_EV_MODELS.map((model, idx) => (
                <option key={model.name} value={idx}>
                  {model.brand}: {model.name.replace(model.brand + ' ', '')} ({model.batterySizeKwh} kWh)
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Bay Actions */}
      <div className="bay-actions">
        {phase === 'idle' && (
          <button className="btn btn-primary" onClick={handlePlugInClick}>
            🔌 Connect {selectedModel.name}
          </button>
        )}

        {/* Mandatory Prepayment Flow (No Pay Later option) */}
        {phase === 'plugged' && (
          <div className="prepay-flow-container">
            <div className="prepay-header">
              <span className="prepay-title">Upfront Payment Required</span>
              <span className="prepay-hint">Enter budget to unlock charger:</span>
            </div>
            <div className="prepay-input-row">
              <div className="currency-input-wrap">
                <span className="currency-prefix">₹</span>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  step="10"
                  placeholder="500"
                  value={prepayAmount}
                  onChange={(e) => setPrepayAmount(e.target.value)}
                  className="custom-amount-input"
                />
              </div>
              <button className="btn btn-razorpay" onClick={handlePrepaySubmit}>
                💳 Pay &amp; Start Charging
              </button>
            </div>
            <button className="btn btn-ghost" onClick={onUnplug}>
              ✖ Disconnect Vehicle
            </button>
          </div>
        )}

        {phase === 'charging' && (
          <button className="btn btn-warning" onClick={onStop}>
            ⏹ Stop Charging Early
          </button>
        )}

        {phase === 'done' && (
          <button className="btn btn-secondary" onClick={onUnplug}>
            🚪 Unplug &amp; Finish Session
          </button>
        )}
      </div>
    </div>
  );
}
