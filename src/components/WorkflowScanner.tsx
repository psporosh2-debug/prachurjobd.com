import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Search, Cpu, Database, Sparkles, ShieldCheck } from 'lucide-react';

interface WorkflowScannerProps {
  isLoading: boolean;
  targetName?: string;
  type?: 'channel' | 'video';
}

export function WorkflowScanner({ isLoading, targetName, type = 'channel' }: WorkflowScannerProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: `Establishing secure connection to YouTube Data V3 API...`, icon: Cpu },
    { label: `Resolving ${type === 'channel' ? 'channel handle / username' : 'video URL'} & ID...`, icon: Search },
    { label: `Extracting metadata, banner, and profile details...`, icon: Database },
    { label: `Parsing video tags, keywords & engagement signals...`, icon: Sparkles },
    { label: `Finalizing deep analysis & assembling metrics report...`, icon: ShieldCheck },
  ];

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 600);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="my-6 p-6 rounded-2xl bg-card border border-primary/30 shadow-xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
      {/* Background glow */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col gap-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center animate-spin">
              <Loader2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <span>Scanning {type === 'channel' ? 'YouTube Channel' : 'YouTube Video'}</span>
                {targetName && <span className="text-primary font-mono text-xs px-2 py-0.5 rounded bg-primary/10">{targetName}</span>}
              </h3>
              <p className="text-xs text-muted-foreground">Please wait while Prachurjo AI inspects and retrieves live data...</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs font-mono font-bold text-primary">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Steps List */}
        <div className="space-y-2 pt-2">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            const isDone = index < currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 text-xs md:text-sm p-2.5 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-primary/10 text-foreground font-semibold border border-primary/20 scale-[1.01]'
                    : isDone
                    ? 'text-muted-foreground line-through opacity-75'
                    : 'text-muted-foreground/50'
                }`}
              >
                <div className="shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <IconComponent className="w-4 h-4 text-muted-foreground/40" />
                  )}
                </div>
                <span className="flex-1">{step.label}</span>
                {isCurrent && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary animate-pulse bg-primary/20 px-2 py-0.5 rounded">
                    Searching...
                  </span>
                )}
                {isDone && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                    Done
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
