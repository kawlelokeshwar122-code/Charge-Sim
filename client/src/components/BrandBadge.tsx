import { getBrandBadge } from '../utils';
import './BrandBadge.css';

interface Props {
  carName: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function BrandBadge({ carName, size = 'md' }: Props) {
  const badge = getBrandBadge(carName);
  return (
    <span
      className={`brand-badge brand-badge-${size}`}
      style={{
        background: badge.bg,
        color: badge.color,
        border: badge.border || 'none',
      }}
      title={carName}
    >
      {badge.text}
    </span>
  );
}
