export type BayPhase = 'idle' | 'plugged' | 'charging' | 'done';

export interface Car {
  name: string;
  brand: string;
  batterySizeKwh: number;
  maxChargeKw: number;
  color: string;
}

export interface BayState {
  id: number;
  label: string;
  maxKw: number;
  phase: BayPhase;
  car: Car | null;
  soc: number;
  kwhAdded: number;
  costInr: number;
  liveKw: number;
  sessionCount: number;
  sessionId: number | null;
  paid: boolean;
  amountPaid?: number | null;
  budgetLimit: number | null;
  prepaid: boolean;
}

export interface StationTotals {
  totalKwh: number;
  totalRevenue: number;
  carsCharging: number;
  sessionsFinished: number;
}
