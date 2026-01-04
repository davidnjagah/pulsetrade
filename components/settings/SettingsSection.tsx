"use client";

import { ReactNode } from "react";

export interface SettingsSectionProps {
  /** Section title */
  title: string;
  /** Optional description for the section */
  description?: string;
  /** Child components (toggles, sliders, etc.) */
  children: ReactNode;
  /** Optional icon component */
  icon?: ReactNode;
}

export default function SettingsSection({
  title,
  description,
  children,
  icon,
}: SettingsSectionProps) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        {icon && (
          <span className="text-pulse-pink">{icon}</span>
        )}
        <h3 className="text-xs font-bold uppercase tracking-wider text-pulse-text-secondary">
          {title}
        </h3>
      </div>

      {/* Optional description */}
      {description && (
        <p className="text-xs text-pulse-text-secondary/70 mb-3">
          {description}
        </p>
      )}

      {/* Section content */}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

// Divider component for use between sections
export function SettingsDivider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-pulse-pink/20 to-transparent" />
  );
}
