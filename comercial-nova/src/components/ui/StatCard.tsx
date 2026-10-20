
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
}

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__icon">
          <Icon size={20} aria-hidden="true" />
        </span>
      </div>

      <p className="stat-card__value">{value}</p>
      <p className="stat-card__description">{description}</p>
    </article>
  );
}
