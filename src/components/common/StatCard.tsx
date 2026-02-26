// src/components/common/StatCard.tsx
import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: string;
  colorClass: string;
  borderColor?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  colorClass,
  borderColor,
  onClick,
  children,
}) => {
  return (
    <div
      className={`p-3 border-round-xl bg-gray-900 border-1 border-gray-800 shadow-4 h-full transition-all transition-duration-300 hover:bg-gray-800 animate-fadeinup ${onClick ? "cursor-pointer" : ""} ${borderColor ? `border-left-3 ${borderColor}` : ""}`}
      onClick={onClick}
    >
      <div className="flex align-items-center gap-2 mb-2">
        <i className={`${icon} ${colorClass} text-xl`}></i>
        <span className={`text-sm font-semibold uppercase tracking-wider ${colorClass}`}>
          {label}
        </span>
      </div>
      <div className="flex flex-column">
        <span className="text-2xl font-bold text-gray-100">{value}</span>
        {subtext && <span className="text-xs text-gray-500 mt-1">{subtext}</span>}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
};
