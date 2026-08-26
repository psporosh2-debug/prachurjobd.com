import React from "react";
import { APP_VERSION } from "@/config/version";

interface VersionBadgeProps {
  version?: string;
  className?: string;
}

export function VersionBadge({ version = APP_VERSION, className = "" }: VersionBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider bg-primary/10 text-primary border border-primary/20 shadow-xs backdrop-blur-xs select-none ${className}`}
      title={`Tool Version ${version}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      <span>{version}</span>
    </span>
  );
}
