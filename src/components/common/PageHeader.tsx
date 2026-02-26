// src/components/common/PageHeader.tsx
import React from "react";
import { Tag } from "primereact/tag";

interface PageHeaderProps {
  title: string;
  icon?: string;
  subtitle?: string;
  count?: number;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  icon,
  subtitle,
  count,
  actions,
}) => {
  return (
    <div className="flex flex-column gap-3 mb-2 animate-fadeinup">
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
        <div className="flex align-items-center gap-3">
          {icon && <i className={`${icon} text-gray-400 text-3xl`} />}
          <div className="flex flex-column">
            <h2 className="m-0 text-3xl font-bold text-gray-100 tracking-tight">
              {title}
            </h2>
            {subtitle && <small className="text-gray-500 font-medium">{subtitle}</small>}
          </div>
          {count !== undefined && (
            <Tag
              value={count}
              className="text-lg px-3 py-1 shadow-2"
              style={{
                borderRadius: "12px",
                background: "#1e293b",
                color: "#3b82f6",
                border: "1px solid #334155"
              }}
            />
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
};
