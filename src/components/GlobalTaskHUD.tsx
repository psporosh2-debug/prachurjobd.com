import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Download, 
  Minimize2, 
  FolderSync, 
  Crop, 
  Palette, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  Zap,
  Activity
} from "lucide-react";
import { useTaskProgress, TaskProgressItem, TaskCategory } from "@/context/TaskProgressContext";
import { sound } from "@/lib/sound";

function getCategoryIcon(category: TaskCategory) {
  switch (category) {
    case "download":
      return Download;
    case "compression":
      return Minimize2;
    case "conversion":
      return FolderSync;
    case "crop":
      return Crop;
    case "favicon":
      return Palette;
    case "analysis":
      return Activity;
    default:
      return Sparkles;
  }
}

function getCategoryBadge(category: TaskCategory) {
  switch (category) {
    case "download":
      return {
        label: "Download",
        color: "bg-pink-500/10 text-pink-500 border-pink-500/20",
        barColor: "bg-gradient-to-r from-pink-500 to-purple-600",
      };
    case "compression":
      return {
        label: "Compress",
        color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        barColor: "bg-gradient-to-r from-emerald-500 to-teal-500",
      };
    case "conversion":
      return {
        label: "Convert",
        color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        barColor: "bg-gradient-to-r from-amber-500 to-orange-500",
      };
    case "crop":
      return {
        label: "Crop",
        color: "bg-teal-500/10 text-teal-500 border-teal-500/20",
        barColor: "bg-gradient-to-r from-teal-500 to-cyan-500",
      };
    case "favicon":
      return {
        label: "Favicon",
        color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
        barColor: "bg-gradient-to-r from-indigo-500 to-purple-500",
      };
    default:
      return {
        label: "Task",
        color: "bg-primary/10 text-primary border-primary/20",
        barColor: "bg-gradient-to-r from-primary to-indigo-500",
      };
  }
}

export function GlobalTaskHUD() {
  const { tasks, activeTasks, isAnyTaskRunning, globalProgress, cancelTask, dismissTask } = useTaskProgress();
  const [isMinimized, setIsMinimized] = useState(false);

  // If no tasks exist in memory, don't show the HUD
  if (tasks.length === 0) {
    return null;
  }

  const primaryTask = activeTasks[0] || tasks[0];
  const primaryBadge = getCategoryBadge(primaryTask?.category || "general");

  return (
    <div className="fixed bottom-4 right-4 z-[9990] max-w-sm sm:max-w-md w-[calc(100vw-2rem)] sm:w-96">
      <AnimatePresence mode="wait">
        {isMinimized ? (
          /* Minimized Compact Floating Pill */
          <motion.div
            key="minimized"
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            onClick={() => {
              sound.tab();
              setIsMinimized(false);
            }}
            className="cursor-pointer ml-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-card/95 backdrop-blur-md border border-border shadow-xl hover:border-primary/50 transition-all group"
          >
            {isAnyTaskRunning ? (
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-ping" />
              </div>
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}

            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <span>{isAnyTaskRunning ? `${activeTasks.length} Active Task${activeTasks.length > 1 ? "s" : ""}` : "Tasks Finished"}</span>
              {isAnyTaskRunning && (
                <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-full text-[10px]">
                  {globalProgress}%
                </span>
              )}
            </div>

            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors ml-1" />
          </motion.div>
        ) : (
          /* Expanded Full Task HUD Panel */
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="rounded-2xl bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-muted/40 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Task Activity Monitor
                </h4>
                {activeTasks.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold bg-primary/15 text-primary">
                    {activeTasks.length} running
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.tab();
                    setIsMinimized(true);
                  }}
                  title="Minimize"
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Task Item List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-border/40 p-1">
              {tasks.map((task) => {
                const Icon = getCategoryIcon(task.category);
                const badge = getCategoryBadge(task.category);
                const isRunning = task.status === "running";
                const isCompleted = task.status === "completed";
                const isError = task.status === "error";
                const isCancelled = task.status === "cancelled";

                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-3 hover:bg-muted/20 transition-colors rounded-xl"
                  >
                    <div className="flex items-start justify-between gap-2.5 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`p-1.5 rounded-lg border shrink-0 ${badge.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate" title={task.title}>
                            {task.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {task.subtitle || "Working..."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isRunning && (
                          <span className="text-xs font-mono font-bold text-foreground">
                            {task.indeterminate ? "~" : `${task.progress}%`}
                          </span>
                        )}

                        {isCompleted && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Done
                          </span>
                        )}

                        {isError && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Error
                          </span>
                        )}

                        {isCancelled && (
                          <span className="text-[10px] font-medium text-muted-foreground">
                            Cancelled
                          </span>
                        )}

                        {isRunning && task.cancelable && (
                          <button
                            type="button"
                            onClick={() => {
                              sound.tab();
                              cancelTask(task.id);
                            }}
                            title="Cancel Task"
                            className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}

                        {!isRunning && (
                          <button
                            type="button"
                            onClick={() => {
                              sound.tab();
                              dismissTask(task.id);
                            }}
                            title="Dismiss"
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                      {isRunning && task.indeterminate ? (
                        <motion.div
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                          className={`h-full w-1/3 rounded-full ${badge.barColor}`}
                        />
                      ) : (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${isCompleted ? 100 : task.progress}%` }}
                          transition={{ duration: 0.2 }}
                          className={`h-full rounded-full ${
                            isCompleted ? "bg-emerald-500" : isError ? "bg-rose-500" : badge.barColor
                          }`}
                        />
                      )}
                    </div>

                    {/* Speed or Step Indicator Meta footer */}
                    {(task.speedStr || task.stepMessage) && (
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-1.5">
                        <span>{task.stepMessage || ""}</span>
                        {task.speedStr && <span className="font-semibold text-primary">{task.speedStr}</span>}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
