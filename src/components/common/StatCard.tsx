// src/components/common/StatCard.tsx
import React from "react";
import "../../styles/StatCard.css";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: string;
  colorClass: string;
  borderColorClass?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  sideSubtext?: boolean;
  compact?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  colorClass,
  borderColorClass,
  onClick,
  children,
  sideSubtext = false,
  compact = false,
}) => {
  return (
    <div
      className={`${compact ? "p-2" : "p-3"} stat-card-base animate-fadeinup ${onClick ? "cursor-pointer" : ""} ${borderColorClass || ""}`}
      onClick={onClick}
    >
      <div className="flex align-items-center gap-2 mb-1">
        <i className={`${icon} ${colorClass} text-base md:text-lg`}></i>
        <span className={`text-xs font-bold uppercase tracking-wider ${colorClass}`}>
          {label}
        </span>
      </div>
      <div className="flex flex-column">
        {sideSubtext ? (
          <div className="flex align-items-baseline justify-content-between gap-2">
            <span className={`stat-value text-2xl md:text-3xl font-bold leading-tight ${colorClass}`}>
              {value}
            </span>
            {subtext && (
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{subtext}</span>
            )}
          </div>
        ) : (
          <>
            <span className={`stat-value text-2xl md:text-3xl font-bold leading-tight ${colorClass}`}>
              {value}
            </span>
            {subtext && (
              <span className="text-xs text-gray-400 font-medium mt-0.5">{subtext}</span>
            )}
          </>
        )}
        {children && <div className="mt-1">{children}</div>}
      </div>
    </div>
  );
};
