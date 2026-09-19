import type { Car } from './types';

const CAR_MODELS: Omit<Car, 'color'>[] = [
  { name: 'Tata Nexon EV',       batterySizeKwh: 40.5, maxChargeKw: 50  },
  { name: 'Tata Tiago EV',       batterySizeKwh: 24,   maxChargeKw: 8.8 },
  { name: 'MG ZS EV',            batterySizeKwh: 50.3, maxChargeKw: 76  },
  { name: 'Hyundai Ioniq 5',     batterySizeKwh: 72.6, maxChargeKw: 220 },
  { name: 'Kia EV6',             batterySizeKwh: 77.4, maxChargeKw: 233 },
  { name: 'BYD Atto 3',          batterySizeKwh: 60.5, maxChargeKw: 100 },
  { name: 'Mahindra XEV 9e',     batterySizeKwh: 79,   maxChargeKw: 175 },
  { name: 'BMW iX',              batterySizeKwh: 111.5, maxChargeKw: 200 },
  { name: 'Tata Punch EV',       batterySizeKwh: 35,   maxChargeKw: 50  },
  { name: 'Ola S1 Pro (scooter)',batterySizeKwh: 4,    maxChargeKw: 2.5 },
  { name: 'MG Comet EV',         batterySizeKwh: 17.3, maxChargeKw: 3.3 },
  { name: 'Volvo XC40 Recharge', batterySizeKwh: 78,   maxChargeKw: 150 },
];

const COLORS = [
  '#e74c3c','#e67e22','#2ecc71','#3498db','#9b59b6',
  '#1abc9c','#f39c12','#d35400','#27ae60','#2980b9',
];

export function randomCar(): Car {
  const model = CAR_MODELS[Math.floor(Math.random() * CAR_MODELS.length)];
  // arrive with 10–60 % state-of-charge
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { ...model, color };
}

/** Starting SOC when a car arrives: 10–60 % */
export function randomStartSoc(): number {
  return 10 + Math.floor(Math.random() * 51); // 10..60
}

/** INR per kWh tariff (flat for simplicity) */
export const TARIFF_INR_PER_KWH = 18;

/**
 * Compute the actual charge rate for a bay+car at a given SOC.
 * Full power up to 80 %, then linear taper to ~10 % of peak at 100 %.
 */
export function calcLiveKw(chargerMaxKw: number, carMaxKw: number, soc: number): number {
  const effective = Math.min(chargerMaxKw, carMaxKw);
  if (soc >= 100) return 0;
  if (soc <= 80) return effective;
  // taper: from 80→100, power drops from effective → effective*0.1
  const taper = 1 - ((soc - 80) / 20) * 0.9;
  return effective * taper;
}

/** Format minutes as hh:mm or mm min */
export function fmtTime(minutes: number): string {
  if (!isFinite(minutes) || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.ceil(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

/** Format kWh */
export function fmtKwh(v: number): string {
  return v.toFixed(2) + ' kWh';
}

/** Format INR */
export function fmtInr(v: number): string {
  return '₹' + v.toFixed(2);
}
