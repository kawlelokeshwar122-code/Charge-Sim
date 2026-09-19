import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { BayState, StationTotals } from './types';
import { randomCar, randomStartSoc, calcLiveKw, TARIFF_INR_PER_KWH } from './utils';
import BayCard from './components/BayCard';
import StationHeader from './components/StationHeader';
import SessionHistory from './components/SessionHistory';
import './App.css';

// ── Constants ──────────────────────────────────────────────
const TICK_REAL_MS = 200; // real-world ms per simulation tick

const INITIAL_BAYS: BayState[] = [
  { id: 1, label: 'Bay 1', maxKw: 11,  phase: 'idle', car: null, soc: 0, kwhAdded: 0, costInr: 0, liveKw: 0, sessionCount: 0 },
  { id: 2, label: 'Bay 2', maxKw: 50,  phase: 'idle', car: null, soc: 0, kwhAdded: 0, costInr: 0, liveKw: 0, sessionCount: 0 },
];

// ── Main App ───────────────────────────────────────────────
export default function App() {
  const [bays, setBays] = useState<BayState[]>(INITIAL_BAYS);
  const [speed, setSpeed] = useState<number>(1);
  const [totals, setTotals] = useState<StationTotals>({
    totalKwh: 0, totalRevenue: 0, carsCharging: 0, sessionsFinished: 0,
  });
  // historyKey bumps to trigger SessionHistory to re-fetch
  const [historyKey, setHistoryKey] = useState(0);

  // Track when charging started per bay (real wall-clock time)
  const chargeStartRef = useRef<Record<number, number>>({});

  // ── Simulation tick ─────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const simHours = (TICK_REAL_MS / 1000) * speed / 3600;

      setBays(prev => {
        let deltaTotalKwh = 0;
        let deltaTotalRev = 0;

        const next = prev.map(bay => {
          if (bay.phase !== 'charging' || !bay.car) return bay;

          const liveKw = calcLiveKw(bay.maxKw, bay.car.maxChargeKw, bay.soc);
          const deltaKwh = liveKw * simHours;
          const deltaSoc  = (deltaKwh / bay.car.batterySizeKwh) * 100;
          const newSoc  = Math.min(100, bay.soc + deltaSoc);
          const newKwh  = bay.kwhAdded + deltaKwh;
          const newCost = newKwh * TARIFF_INR_PER_KWH;

          deltaTotalKwh += deltaKwh;
          deltaTotalRev += deltaKwh * TARIFF_INR_PER_KWH;

          const finished = newSoc >= 100;
          return {
            ...bay,
            soc: finished ? 100 : newSoc,
            kwhAdded: newKwh,
            costInr: newCost,
            liveKw: finished ? 0 : liveKw,
            phase: finished ? 'done' : 'charging',
          } as BayState;
        });

        if (deltaTotalKwh > 0) {
          setTotals(t => ({
            ...t,
            totalKwh: t.totalKwh + deltaTotalKwh,
            totalRevenue: t.totalRevenue + deltaTotalRev,
          }));
        }

        return next;
      });
    }, TICK_REAL_MS);

    return () => clearInterval(interval);
  }, [speed]);

  // Keep live counters in sync
  useEffect(() => {
    const charging = bays.filter(b => b.phase === 'charging').length;
    const finished = bays.reduce((sum, b) => sum + b.sessionCount, 0);
    setTotals(t => ({ ...t, carsCharging: charging, sessionsFinished: finished }));
  }, [bays]);

  // ── Save session to backend ──────────────────────────────
  const saveSession = useCallback(async (bay: BayState) => {
    if (!bay.car || bay.kwhAdded < 0.001) return;
    const startMs = chargeStartRef.current[bay.id];
    const durationMin = startMs ? (Date.now() - startMs) / 60000 : null;
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bay: bay.label,
          car: bay.car.name,
          kwhAdded: bay.kwhAdded,
          costInr: bay.costInr,
          durationMin,
          finishedAt: new Date().toISOString(),
        }),
      });
      setHistoryKey(k => k + 1); // refresh list
    } catch (err) {
      console.warn('Could not save session:', err);
    }
  }, []);

  // ── Bay Actions ─────────────────────────────────────────
  const handlePlugIn = useCallback((bayId: number) => {
    const car = randomCar();
    const startSoc = randomStartSoc();
    setBays(prev =>
      prev.map(b =>
        b.id === bayId && b.phase === 'idle'
          ? { ...b, phase: 'plugged', car, soc: startSoc, kwhAdded: 0, costInr: 0, liveKw: 0 }
          : b
      )
    );
  }, []);

  const handleStart = useCallback((bayId: number) => {
    chargeStartRef.current[bayId] = Date.now();
    setBays(prev =>
      prev.map(b => {
        if (b.id !== bayId || b.phase !== 'plugged' || !b.car) return b;
        const liveKw = calcLiveKw(b.maxKw, b.car.maxChargeKw, b.soc);
        return { ...b, phase: 'charging', liveKw };
      })
    );
  }, []);

  const handleStop = useCallback((bayId: number) => {
    setBays(prev =>
      prev.map(b =>
        b.id === bayId && b.phase === 'charging'
          ? { ...b, phase: 'plugged', liveKw: 0 }
          : b
      )
    );
  }, []);

  const handleUnplug = useCallback((bayId: number) => {
    setBays(prev => {
      const bay = prev.find(b => b.id === bayId);
      if (bay) saveSession(bay);

      return prev.map(b => {
        if (b.id !== bayId) return b;
        const wasSession = b.phase === 'done' || (b.phase === 'plugged' && b.kwhAdded > 0);
        delete chargeStartRef.current[bayId];
        return {
          ...b,
          phase: 'idle',
          car: null,
          soc: 0,
          kwhAdded: 0,
          costInr: 0,
          liveKw: 0,
          sessionCount: b.sessionCount + (wasSession ? 1 : 0),
        };
      });
    });
  }, [saveSession]);

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="app">
      <StationHeader totals={totals} speed={speed} onSpeedChange={setSpeed} />

      <main className="bays-grid">
        {bays.map(bay => (
          <BayCard
            key={bay.id}
            bay={bay}
            onPlugIn={() => handlePlugIn(bay.id)}
            onStart={() => handleStart(bay.id)}
            onStop={() => handleStop(bay.id)}
            onUnplug={() => handleUnplug(bay.id)}
          />
        ))}
      </main>

      <SessionHistory key={historyKey} />

      <footer className="app-footer">
        <span>⚡ Charge Station Simulator</span>
        <span>Tariff: ₹{TARIFF_INR_PER_KWH}/kWh · Power tapers after 80% SOC</span>
      </footer>
    </div>
  );
}
