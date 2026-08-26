import React from "react";
import { motion } from "motion/react";
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TaskProgressCardProps {
  progress: number;
  title: string;
  subtitle?: string;
  stepMessage?: string;
  status?: "running" | "completed" | "error";
  speedStr?: string;
  className?: string;
  accentColor?: "pink" | "emerald" | "amber" | "indigo" | "primary" | "teal" | "purple";
}

export function TaskProgressCard({
  progress,
  title,
  subtitle,
  stepMessage,
  status = "running",
  speedStr,
  className = "",
  accentColor = "primary",
}: TaskProgressCardProps) {
  const accentClasses = {
    pink: {
      border: "border-pink-500/30",
      bg: "from-pink-500/10 via-purple-500/5 to-transparent",
      badge: "bg-pink-500/15 text-pink-500 border-pink-500/30",
      bar: "bg-gradient-to-r from-pink-500 to-purple-600",
    },
    emerald: {
      border: "border-emerald-500/30",
      bg: "from-emerald-500/10 via-teal-500/5 to-transparent",
      badge: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
      bar: "bg-gradient-to-r from-emerald-500 to-teal-500",
    },
    teal: {
      border: "border-teal-500/30",
      bg: "from-teal-500/10 via-emerald-500/5 to-transparent",
      badge: "bg-teal-500/15 text-teal-500 border-teal-500/30",
      bar: "bg-gradient-to-r from-teal-500 to-emerald-500",
    },
    purple: {
      border: "border-purple-500/30",
      bg: "from-purple-500/10 via-pink-500/5 to-transparent",
      badge: "bg-purple-500/15 text-purple-500 border-purple-500/30",
      bar: "bg-gradient-to-r from-purple-500 to-indigo-600",
    },
    amber: {
      border: "border-amber-500/30",
      bg: "from-amber-500/10 via-orange-500/5 to-transparent",
      badge: "bg-amber-500/15 text-amber-500 border-amber-500/30",
      bar: "bg-gradient-to-r from-amber-500 to-orange-500",
    },
    indigo: {
      border: "border-indigo-500/30",
      bg: "from-indigo-500/10 via-blue-500/5 to-transparent",
      badge: "bg-indigo-500/15 text-indigo-500 border-indigo-500/30",
      bar: "bg-gradient-to-r from-indigo-500 to-blue-500",
    },
    primary: {
      border: "border-primary/30",
      bg: "from-primary/10 via-indigo-500/5 to-transparent",
      badge: "bg-primary/15 text-primary border-primary/30",
      bar: "bg-gradient-to-r from-primary to-indigo-600",
    },
  }[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-2xl p-4 sm:p-5 border bg-gradient-to-br shadow-lg ${accentClasses.border} ${accentClasses.bg} ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {status === "running" ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
          ) : status === "completed" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}

          <div className="min-w-0">
            <h4 className="text-sm font-bold text-foreground truncate">{title}</h4>
            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {speedStr && (
            <span className="text-[11px] font-mono font-semibold text-muted-foreground hidden sm:inline-block">
              {speedStr}
            </span>
          )}
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${accentClasses.badge}`}>
            {progress}%
          </span>
        </div>
      </div>

      {/* Progress Bar with animated gradient */}
      <div className="relative w-full h-2.5 bg-muted/80 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`h-full rounded-full ${status === "completed" ? "bg-emerald-500" : accentClasses.bar}`}
        />
      </div>

      {stepMessage && (
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{stepMessage}</span>
          <span className="font-medium text-[11px]">{status === "completed" ? "Completed" : "In Progress..."}</span>
        </div>
      )}
    </motion.div>
  );
}
