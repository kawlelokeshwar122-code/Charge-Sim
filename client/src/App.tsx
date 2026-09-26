import { useCallback, useEffect, useRef, useState } from 'react';
import type { BayState, StationTotals, Car } from './types';
import { randomStartSoc, calcLiveKw, TARIFF_INR_PER_KWH } from './utils';
import BayCard from './components/BayCard';
import StationHeader from './components/StationHeader';
import SessionHistory from './components/SessionHistory';
import './App.css';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const TICK_REAL_MS = 200;

const INITIAL_BAYS: BayState[] = [
  { id: 1, label: 'Bay 1', maxKw: 11, phase: 'idle', car: null, soc: 0, kwhAdded: 0, costInr: 0, liveKw: 0, sessionCount: 0, sessionId: null, paid: false, amountPaid: null, budgetLimit: null, prepaid: false },
  { id: 2, label: 'Bay 2', maxKw: 50, phase: 'idle', car: null, soc: 0, kwhAdded: 0, costInr: 0, liveKw: 0, sessionCount: 0, sessionId: null, paid: false, amountPaid: null, budgetLimit: null, prepaid: false },
];

export default function App() {
  const [bays, setBays] = useState<BayState[]>(INITIAL_BAYS);
  const [speed, setSpeed] = useState<number>(1);
  const [totals, setTotals] = useState<StationTotals>({
    totalKwh: 0, totalRevenue: 0, carsCharging: 0, sessionsFinished: 0,
  });
  const [historyKey, setHistoryKey] = useState(0);

  const chargeStartRef = useRef<Record<number, number>>({});
  const savingRef = useRef<Set<number>>(new Set());

  // Simulation tick
  useEffect(() => {
    const interval = setInterval(() => {
      const simHours = (TICK_REAL_MS / 1000) * speed / 3600;

      setBays((prev) => {
        let deltaTotalKwh = 0;
        let deltaTotalRev = 0;

        const next = prev.map((bay) => {
          if (bay.phase !== 'charging' || !bay.car) return bay;

          const liveKw = calcLiveKw(bay.maxKw, bay.car.maxChargeKw, bay.soc);
          const deltaKwh = liveKw * simHours;
          const deltaSoc = (deltaKwh / bay.car.batterySizeKwh) * 100;
          const nextSoc = bay.soc + deltaSoc;
          const nextKwh = bay.kwhAdded + deltaKwh;
          const nextCost = nextKwh * TARIFF_INR_PER_KWH;

          const hitBatteryFull = nextSoc >= 100;
          const hitBudgetLimit = bay.budgetLimit != null && nextCost >= bay.budgetLimit;
          const finished = hitBatteryFull || hitBudgetLimit;

          let finalCost = nextCost;
          let finalKwh = nextKwh;
          let finalSoc = nextSoc;

          if (hitBudgetLimit && bay.budgetLimit != null) {
            finalCost = bay.budgetLimit;
            finalKwh = bay.budgetLimit / TARIFF_INR_PER_KWH;
            const actualDeltaKwh = finalKwh - bay.kwhAdded;
            finalSoc = Math.min(100, bay.soc + (actualDeltaKwh / bay.car.batterySizeKwh) * 100);
          } else if (hitBatteryFull) {
            finalSoc = 100;
          }

          const costAdded = finalCost - bay.costInr;
          const kwhAddedTick = finalKwh - bay.kwhAdded;

          if (kwhAddedTick > 0) deltaTotalKwh += kwhAddedTick;
          if (costAdded > 0) deltaTotalRev += costAdded;

          return {
            ...bay,
            soc: Math.min(100, finalSoc),
            kwhAdded: finalKwh,
            costInr: finalCost,
            liveKw: finished ? 0 : liveKw,
            phase: finished ? 'done' : 'charging',
          } as BayState;
        });

        if (deltaTotalKwh > 0 || deltaTotalRev > 0) {
          setTotals((t) => ({
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

  useEffect(() => {
    const charging = bays.filter((b) => b.phase === 'charging').length;
    const finished = bays.reduce((sum, b) => sum + b.sessionCount, 0);
    setTotals((t) => ({ ...t, carsCharging: charging, sessionsFinished: finished }));
  }, [bays]);

  // Save session to backend once charging is completed
  const saveSession = useCallback(async (bay: BayState): Promise<number | null> => {
    if (!bay.car || bay.kwhAdded < 0.001) return null;
    const startMs = chargeStartRef.current[bay.id];
    const durationMin = startMs ? (Date.now() - startMs) / 60000 : null;
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bay: bay.label,
          car: bay.car.name,
          kwhAdded: bay.kwhAdded,
          costInr: bay.costInr,
          durationMin,
          finishedAt: new Date().toISOString(),
          paid: bay.paid,
          prepaid: bay.prepaid,
          amountPaid: bay.amountPaid != null ? bay.amountPaid : (bay.paid ? bay.costInr : null),
        }),
      });
      const data = await res.json();
      return data.id ?? null;
    } catch (err) {
      console.warn('Failed to save session:', err);
      return null;
    }
  }, []);

  // When a bay reaches done, auto-save session
  useEffect(() => {
    bays.forEach((bay) => {
      if (bay.phase === 'done' && bay.sessionId === null && bay.car && !savingRef.current.has(bay.id)) {
        savingRef.current.add(bay.id);
        saveSession(bay).then((id) => {
          savingRef.current.delete(bay.id);
          if (id != null) {
            setBays((prev) => prev.map((b) => (b.id === bay.id ? { ...b, sessionId: id } : b)));
            setHistoryKey((k) => k + 1);
          }
        });
      }
    });
  }, [bays, saveSession]);

  // Mandatory Prepay upfront handler
  const handlePrepay = useCallback(async (bayId: number, amount: number) => {
    const bay = bays.find((b) => b.id === bayId);
    if (!bay || !bay.car) return;

    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert('Prepay order initialization failed: ' + (err.error || 'Server error'));
        return;
      }

      const { orderId, amount: paiseAmount, currency, keyId } = await res.json();

      const rzp = new window.Razorpay({
        key: keyId,
        amount: paiseAmount,
        currency,
        order_id: orderId,
        name: 'Charge Station Hub',
        description: `Prepaid Charging - ${bay.label} (${bay.car.name})`,
        theme: { color: '#3b82f6' },
        prefill: {
          name: 'EV Driver',
          email: 'driver@chargestation.com',
          contact: '9999999999',
        },
        handler: async (response: any) => {
          try {
            const vRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amountPaid: amount,
              }),
            });
            const vData = await vRes.json();
            if (vData.ok) {
              // Start charging automatically upon verified prepayment
              chargeStartRef.current[bayId] = Date.now();
              setBays((prev) =>
                prev.map((b) => {
                  if (b.id !== bayId || !b.car) return b;
                  const liveKw = calcLiveKw(b.maxKw, b.car.maxChargeKw, b.soc);
                  return {
                    ...b,
                    phase: 'charging',
                    liveKw,
                    budgetLimit: amount,
                    prepaid: true,
                    paid: true,
                    amountPaid: amount,
                  };
                })
              );
            } else {
              alert('Payment verification failed: ' + vData.error);
            }
          } catch {
            alert('Payment verification request failed.');
          }
        },
      });

      rzp.open();
    } catch {
      alert('Failed to connect to backend.');
    }
  }, [bays]);

  // Connect selected EV
  const handlePlugIn = useCallback((bayId: number, selectedCar: Car) => {
    const startSoc = randomStartSoc();
    setBays((prev) =>
      prev.map((b) =>
        b.id === bayId && b.phase === 'idle'
          ? {
              ...b,
              phase: 'plugged',
              car: selectedCar,
              soc: startSoc,
              kwhAdded: 0,
              costInr: 0,
              liveKw: 0,
              sessionId: null,
              paid: false,
              amountPaid: null,
              budgetLimit: null,
              prepaid: false,
            }
          : b
      )
    );
  }, []);

  const handleStop = useCallback((bayId: number) => {
    setBays((prev) =>
      prev.map((b) =>
        b.id === bayId && b.phase === 'charging' ? { ...b, phase: 'done', liveKw: 0 } : b
      )
    );
  }, []);

  const handleUnplug = useCallback((bayId: number) => {
    savingRef.current.delete(bayId);
    delete chargeStartRef.current[bayId];
    setBays((prev) =>
      prev.map((b) => {
        if (b.id !== bayId) return b;
        const wasSession = b.phase === 'done' || (b.phase === 'plugged' && b.kwhAdded > 0);
        return {
          ...b,
          phase: 'idle',
          car: null,
          soc: 0,
          kwhAdded: 0,
          costInr: 0,
          liveKw: 0,
          sessionId: null,
          paid: false,
          amountPaid: null,
          budgetLimit: null,
          prepaid: false,
          sessionCount: b.sessionCount + (wasSession ? 1 : 0),
        };
      })
    );
  }, []);

  return (
    <div className="app">
      <StationHeader totals={totals} speed={speed} onSpeedChange={setSpeed} />
      <main className="bays-grid">
        {bays.map((bay) => (
          <BayCard
            key={bay.id}
            bay={bay}
            onPlugIn={handlePlugIn}
            onStop={() => handleStop(bay.id)}
            onUnplug={() => handleUnplug(bay.id)}
            onPrepay={handlePrepay}
          />
        ))}
      </main>
      <SessionHistory key={historyKey} />
      <footer className="app-footer">
        <span>⚡ Charge Station Simulator</span>
        <span>Tariff: ₹{TARIFF_INR_PER_KWH}/kWh · Power tapers after 80% SOC · Mandatory Prepayment Hub</span>
      </footer>
    </div>
  );
}
