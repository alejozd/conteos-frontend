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
    <div className="flex flex-column gap-3 mb-4 animate-fadeinup">
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
        <div className="flex align-items-center gap-3">
          {icon && <i className={`${icon} text-primary text-3xl`} />}
          <div className="flex flex-column">
            <h2 className="m-0 text-3xl font-bold text-gray-100 tracking-tight">
              {title}
            </h2>
            {subtitle && <small className="text-gray-500">{subtitle}</small>}
          </div>
          {count !== undefined && (
            <Tag
              value={count}
              severity="success"
              className="text-lg px-3 py-1 shadow-1"
              style={{
                borderRadius: "20px",
                background: "linear-gradient(45deg, #3B82F6, #2563EB)",
              }}
            />
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
};
