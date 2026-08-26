import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTaskProgress } from "@/context/TaskProgressContext";

export function GlobalTopProgressBar() {
  const { isAnyTaskRunning, globalProgress, activeTasks } = useTaskProgress();

  if (!isAnyTaskRunning && globalProgress === 0) {
    return null;
  }

  // Choose accent gradient based on active category
  const primaryTask = activeTasks[0];
  const category = primaryTask?.category || "general";

  let gradientClasses = "from-primary via-indigo-500 to-cyan-400";
  let glowClasses = "shadow-[0_0_12px_rgba(59,130,246,0.6)]";

  if (category === "download") {
    gradientClasses = "from-pink-500 via-purple-500 to-indigo-500";
    glowClasses = "shadow-[0_0_12px_rgba(236,72,153,0.6)]";
  } else if (category === "compression" || category === "crop") {
    gradientClasses = "from-emerald-500 via-teal-500 to-cyan-400";
    glowClasses = "shadow-[0_0_12px_rgba(16,185,129,0.6)]";
  } else if (category === "conversion" || category === "favicon") {
    gradientClasses = "from-amber-500 via-orange-500 to-rose-500";
    glowClasses = "shadow-[0_0_12px_rgba(245,158,11,0.6)]";
  } else if (category === "analysis") {
    gradientClasses = "from-rose-500 via-red-500 to-purple-600";
    glowClasses = "shadow-[0_0_12px_rgba(244,63,94,0.6)]";
  }

  const isIndeterminate = primaryTask?.indeterminate;

  return (
    <AnimatePresence>
      {isAnyTaskRunning && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-1.5 overflow-hidden bg-background/20 backdrop-blur-sm"
        >
          {isIndeterminate ? (
            <motion.div
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut",
              }}
              className={`h-full w-1/3 bg-gradient-to-r ${gradientClasses} rounded-full ${glowClasses}`}
            />
          ) : (
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${Math.max(3, globalProgress)}%` }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${gradientClasses} rounded-r-full ${glowClasses}`}
            />
          )}

          {/* Shimmer light effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
