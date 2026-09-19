// Types for the charge station simulator

export type BayPhase = 'idle' | 'plugged' | 'charging' | 'done';

export interface Car {
  name: string;
  batterySizeKwh: number;   // total battery capacity
  maxChargeKw: number;      // car's max accepted charge rate
  color: string;
}

export interface BayState {
  id: number;
  label: string;
  maxKw: number;           // charger hardware limit
  phase: BayPhase;
  car: Car | null;
  soc: number;             // 0–100 %
  kwhAdded: number;
  costInr: number;
  liveKw: number;
  sessionCount: number;
}

export interface StationTotals {
  totalKwh: number;
  totalRevenue: number;
  carsCharging: number;
  sessionsFinished: number;
}
