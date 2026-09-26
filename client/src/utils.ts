import type { Car } from './types';

export interface CarModel {
  name: string;
  brand: string;
  batterySizeKwh: number;
  maxChargeKw: number;
}

export const INDIAN_EV_MODELS: CarModel[] = [
  // Tata
  { name: 'Tata Nexon EV', brand: 'Tata', batterySizeKwh: 40.5, maxChargeKw: 50 },
  { name: 'Tata Tiago EV', brand: 'Tata', batterySizeKwh: 24, maxChargeKw: 8.8 },
  { name: 'Tata Punch EV', brand: 'Tata', batterySizeKwh: 35, maxChargeKw: 50 },
  { name: 'Tata Curvv EV', brand: 'Tata', batterySizeKwh: 55, maxChargeKw: 70 },
  // Mahindra
  { name: 'Mahindra XUV400', brand: 'Mahindra', batterySizeKwh: 39.4, maxChargeKw: 50 },
  { name: 'Mahindra BE 6', brand: 'Mahindra', batterySizeKwh: 59, maxChargeKw: 140 },
  { name: 'Mahindra XEV 9e', brand: 'Mahindra', batterySizeKwh: 79, maxChargeKw: 175 },
  // MG
  { name: 'MG Comet EV', brand: 'MG', batterySizeKwh: 17.3, maxChargeKw: 3.3 },
  { name: 'MG ZS EV', brand: 'MG', batterySizeKwh: 50.3, maxChargeKw: 76 },
  { name: 'MG Windsor EV', brand: 'MG', batterySizeKwh: 38, maxChargeKw: 45 },
  // Hyundai
  { name: 'Hyundai Ioniq 5', brand: 'Hyundai', batterySizeKwh: 72.6, maxChargeKw: 220 },
  { name: 'Hyundai Kona Electric', brand: 'Hyundai', batterySizeKwh: 39.2, maxChargeKw: 50 },
  // Kia
  { name: 'Kia EV6', brand: 'Kia', batterySizeKwh: 77.4, maxChargeKw: 233 },
  // BYD
  { name: 'BYD Atto 3', brand: 'BYD', batterySizeKwh: 60.5, maxChargeKw: 100 },
  { name: 'BYD Seal', brand: 'BYD', batterySizeKwh: 82.5, maxChargeKw: 150 },
  // Citroen
  { name: 'Citroen eC3', brand: 'Citroen', batterySizeKwh: 29.2, maxChargeKw: 30 },
  // Maruti Suzuki
  { name: 'Maruti Suzuki eVX', brand: 'Maruti Suzuki', batterySizeKwh: 60, maxChargeKw: 100 },
  // BMW
  { name: 'BMW iX', brand: 'BMW', batterySizeKwh: 111.5, maxChargeKw: 200 },
  // Mercedes-Benz
  { name: 'Mercedes-Benz EQB', brand: 'Mercedes-Benz', batterySizeKwh: 70.5, maxChargeKw: 100 },
  // Audi
  { name: 'Audi e-tron', brand: 'Audi', batterySizeKwh: 95, maxChargeKw: 150 },
];

export interface BrandBadgeInfo {
  text: string;
  bg: string;
  color: string;
  border?: string;
}

export function getBrandBadge(brandOrName: string): BrandBadgeInfo {
  const s = brandOrName.toLowerCase();
  if (s.includes('tata')) {
    return { text: 'T', bg: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: '#ffffff', border: '1px solid #3b82f6' };
  }
  if (s.includes('mahindra')) {
    return { text: 'M', bg: 'linear-gradient(135deg, #991b1b, #dc2626)', color: '#ffffff', border: '1px solid #ef4444' };
  }
  if (s.includes('mg')) {
    return { text: 'MG', bg: 'linear-gradient(135deg, #14532d, #16a34a)', color: '#ffffff', border: '1px solid #22c55e' };
  }
  if (s.includes('hyundai')) {
    return { text: 'H', bg: 'linear-gradient(135deg, #0c4a6e, #0284c7)', color: '#ffffff', border: '1px solid #38bdf8' };
  }
  if (s.includes('kia')) {
    return { text: 'KIA', bg: 'linear-gradient(135deg, #18181b, #27272a)', color: '#ef4444', border: '1.5px solid #ef4444' };
  }
  if (s.includes('byd')) {
    return { text: 'BYD', bg: 'linear-gradient(135deg, #0f766e, #0d9488)', color: '#ffffff', border: '1px solid #2dd4bf' };
  }
  if (s.includes('citroen')) {
    return { text: 'C', bg: 'linear-gradient(135deg, #831843, #be185d)', color: '#ffffff', border: '1px solid #f472b6' };
  }
  if (s.includes('maruti')) {
    return { text: 'MS', bg: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#ffffff', border: '1px solid #60a5fa' };
  }
  if (s.includes('bmw')) {
    return { text: 'BMW', bg: 'linear-gradient(135deg, #0369a1, #38bdf8)', color: '#ffffff', border: '1px solid #7dd3fc' };
  }
  if (s.includes('mercedes')) {
    return { text: 'MB', bg: 'linear-gradient(135deg, #334155, #64748b)', color: '#ffffff', border: '1px solid #94a3b8' };
  }
  if (s.includes('audi')) {
    return { text: 'AUDI', bg: 'linear-gradient(135deg, #09090b, #27272a)', color: '#f4f4f5', border: '1px solid #a1a1aa' };
  }
  return { text: 'EV', bg: 'linear-gradient(135deg, #374151, #4b5563)', color: '#ffffff', border: '1px solid #6b7280' };
}

const COLORS = [
  '#e74c3c', '#e67e22', '#2ecc71', '#3498db', '#9b59b6',
  '#1abc9c', '#f39c12', '#d35400', '#27ae60', '#2980b9',
];

export function createCar(model: CarModel): Car {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { ...model, color };
}

export function randomCar(): Car {
  const model = INDIAN_EV_MODELS[Math.floor(Math.random() * INDIAN_EV_MODELS.length)];
  return createCar(model);
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
