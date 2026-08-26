import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { sound } from "@/lib/sound";

export type TaskCategory = "download" | "compression" | "conversion" | "analysis" | "crop" | "favicon" | "audio" | "general";
export type TaskStatus = "running" | "completed" | "error" | "cancelled";

export interface TaskProgressItem {
  id: string;
  title: string;
  subtitle?: string;
  category: TaskCategory;
  progress: number; // 0 to 100
  indeterminate?: boolean;
  status: TaskStatus;
  startTime: number;
  totalBytes?: number;
  loadedBytes?: number;
  speedStr?: string;
  error?: string;
  stepMessage?: string;
  cancelable?: boolean;
  onCancel?: () => void;
  metadata?: Record<string, any>;
}

export interface StartTaskOptions {
  id?: string;
  title: string;
  subtitle?: string;
  category?: TaskCategory;
  indeterminate?: boolean;
  initialProgress?: number;
  totalBytes?: number;
  cancelable?: boolean;
  onCancel?: () => void;
  metadata?: Record<string, any>;
}

export interface UpdateTaskOptions {
  progress?: number;
  subtitle?: string;
  stepMessage?: string;
  loadedBytes?: number;
  totalBytes?: number;
  speedStr?: string;
  indeterminate?: boolean;
  metadata?: Record<string, any>;
}

export interface DownloadWithProgressOptions {
  title?: string;
  category?: TaskCategory;
  mimeType?: string;
  onProgress?: (progress: number, loaded: number, total: number) => void;
}

interface TaskProgressContextType {
  tasks: TaskProgressItem[];
  activeTasks: TaskProgressItem[];
  isAnyTaskRunning: boolean;
  globalProgress: number; // 0 - 100
  startTask: (options: StartTaskOptions) => string;
  updateTask: (id: string, updates: UpdateTaskOptions) => void;
  completeTask: (id: string, subtitle?: string) => void;
  failTask: (id: string, error: string) => void;
  cancelTask: (id: string) => void;
  dismissTask: (id: string) => void;
  clearCompletedTasks: () => void;
  runTrackedTask: <T>(
    options: StartTaskOptions,
    runner: (helpers: {
      updateProgress: (progress: number, subtitle?: string, stepMessage?: string) => void;
      setIndeterminate: (indeterminate: boolean) => void;
      setStep: (step: number, totalSteps: number, message: string) => void;
      isCancelled: () => boolean;
    }) => Promise<T>
  ) => Promise<T>;
  downloadWithProgress: (
    url: string,
    filename: string,
    options?: DownloadWithProgressOptions
  ) => Promise<Blob | null>;
}

const TaskProgressContext = createContext<TaskProgressContextType | null>(null);

export function TaskProgressProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<TaskProgressItem[]>([]);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Clean completed tasks after timeout
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prev) =>
        prev.filter((t) => {
          if (t.status === "completed" || t.status === "cancelled") {
            const age = Date.now() - t.startTime;
            // Keep completed/cancelled items around for 8 seconds for visual satisfaction, then clean up
            return age < 8000;
          }
          if (t.status === "error") {
            const age = Date.now() - t.startTime;
            return age < 15000; // keep error messages around for 15 seconds
          }
          return true;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const activeTasks = tasks.filter((t) => t.status === "running");
  const isAnyTaskRunning = activeTasks.length > 0;

  // Calculate global average progress of active tasks
  const globalProgress = activeTasks.length > 0
    ? Math.round(
        activeTasks.reduce((acc, t) => acc + (t.indeterminate ? 50 : Math.min(100, Math.max(0, t.progress))), 0) /
          activeTasks.length
      )
    : 0;

  const startTask = useCallback((options: StartTaskOptions): string => {
    const id = options.id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newTask: TaskProgressItem = {
      id,
      title: options.title,
      subtitle: options.subtitle || "Processing in progress...",
      category: options.category || "general",
      progress: options.initialProgress ?? (options.indeterminate ? 0 : 5),
      indeterminate: options.indeterminate ?? false,
      status: "running",
      startTime: Date.now(),
      totalBytes: options.totalBytes,
      loadedBytes: 0,
      cancelable: options.cancelable ?? false,
      onCancel: options.onCancel,
      metadata: options.metadata,
    };

    setTasks((prev) => {
      const existingIdx = prev.findIndex((t) => t.id === id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = newTask;
        return next;
      }
      return [...prev, newTask];
    });

    return id;
  }, []);

  const updateTask = useCallback((id: string, updates: UpdateTaskOptions) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;

        let speedStr = updates.speedStr || t.speedStr;
        if (updates.loadedBytes && !updates.speedStr) {
          const elapsedSec = (Date.now() - t.startTime) / 1000;
          if (elapsedSec > 0.5) {
            const bytesPerSec = updates.loadedBytes / elapsedSec;
            if (bytesPerSec > 1024 * 1024) {
              speedStr = `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
            } else {
              speedStr = `${Math.round(bytesPerSec / 1024)} KB/s`;
            }
          }
        }

        let calculatedProgress = updates.progress !== undefined ? updates.progress : t.progress;
        if (updates.loadedBytes !== undefined && updates.totalBytes && updates.totalBytes > 0) {
          calculatedProgress = Math.min(99, Math.round((updates.loadedBytes / updates.totalBytes) * 100));
        }

        return {
          ...t,
          progress: Math.min(100, Math.max(0, calculatedProgress)),
          subtitle: updates.subtitle !== undefined ? updates.subtitle : t.subtitle,
          stepMessage: updates.stepMessage !== undefined ? updates.stepMessage : t.stepMessage,
          loadedBytes: updates.loadedBytes !== undefined ? updates.loadedBytes : t.loadedBytes,
          totalBytes: updates.totalBytes !== undefined ? updates.totalBytes : t.totalBytes,
          indeterminate: updates.indeterminate !== undefined ? updates.indeterminate : t.indeterminate,
          speedStr,
          metadata: updates.metadata ? { ...t.metadata, ...updates.metadata } : t.metadata,
        };
      })
    );
  }, []);

  const completeTask = useCallback((id: string, subtitle?: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          progress: 100,
          status: "completed",
          indeterminate: false,
          subtitle: subtitle || "Completed successfully!",
          stepMessage: "100% Finished",
        };
      })
    );
    sound.success();
    abortControllersRef.current.delete(id);
  }, []);

  const failTask = useCallback((id: string, error: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          status: "error",
          indeterminate: false,
          error,
          subtitle: `Failed: ${error}`,
        };
      })
    );
    sound.error();
    abortControllersRef.current.delete(id);
  }, []);

  const cancelTask = useCallback((id: string) => {
    const controller = abortControllersRef.current.get(id);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(id);
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (t.onCancel) {
          try {
            t.onCancel();
          } catch (e) {
            console.error("Cancel task callback error:", e);
          }
        }
        return {
          ...t,
          status: "cancelled",
          indeterminate: false,
          subtitle: "Task was cancelled.",
        };
      })
    );
  }, []);

  const dismissTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    abortControllersRef.current.delete(id);
  }, []);

  const clearCompletedTasks = useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status === "running"));
  }, []);

  const runTrackedTask = useCallback(
    async <T,>(
      options: StartTaskOptions,
      runner: (helpers: {
        updateProgress: (progress: number, subtitle?: string, stepMessage?: string) => void;
        setIndeterminate: (indeterminate: boolean) => void;
        setStep: (step: number, totalSteps: number, message: string) => void;
        isCancelled: () => boolean;
      }) => Promise<T>
    ): Promise<T> => {
      const taskId = startTask(options);
      let cancelled = false;

      const helpers = {
        updateProgress: (progress: number, subtitle?: string, stepMessage?: string) => {
          updateTask(taskId, { progress, subtitle, stepMessage, indeterminate: false });
        },
        setIndeterminate: (indeterminate: boolean) => {
          updateTask(taskId, { indeterminate });
        },
        setStep: (step: number, totalSteps: number, message: string) => {
          const pct = Math.min(98, Math.max(5, Math.round((step / totalSteps) * 100)));
          updateTask(taskId, {
            progress: pct,
            subtitle: message,
            stepMessage: `Step ${step}/${totalSteps}: ${message}`,
            indeterminate: false,
          });
        },
        isCancelled: () => cancelled,
      };

      try {
        const result = await runner(helpers);
        completeTask(taskId);
        return result;
      } catch (err: any) {
        failTask(taskId, err.message || "An unexpected error occurred.");
        throw err;
      }
    },
    [startTask, updateTask, completeTask, failTask]
  );

  const downloadWithProgress = useCallback(
    async (
      url: string,
      filename: string,
      options?: DownloadWithProgressOptions
    ): Promise<Blob | null> => {
      const controller = new AbortController();
      const taskId = startTask({
        title: options?.title || `Downloading ${filename}`,
        subtitle: "Connecting to server...",
        category: options?.category || "download",
        cancelable: true,
        onCancel: () => controller.abort(),
      });
      abortControllersRef.current.set(taskId, controller);

      try {
        updateTask(taskId, { subtitle: "Sending request...", progress: 5 });

        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const contentLengthHeader = response.headers.get("content-length");
        const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

        if (totalBytes > 0) {
          updateTask(taskId, {
            totalBytes,
            subtitle: `0 MB / ${(totalBytes / (1024 * 1024)).toFixed(1)} MB`,
            progress: 10,
          });
        }

        const body = response.body;
        if (!body) {
          const blob = await response.blob();
          completeTask(taskId, `Downloaded ${(blob.size / (1024 * 1024)).toFixed(1)} MB`);
          triggerBrowserDownload(blob, filename, options?.mimeType);
          return blob;
        }

        const reader = body.getReader();
        const chunks: Uint8Array[] = [];
        let receivedBytes = 0;
        let lastUpdateTime = Date.now();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          if (value) {
            chunks.push(value);
            receivedBytes += value.length;

            const now = Date.now();
            if (now - lastUpdateTime > 80 || (totalBytes > 0 && receivedBytes === totalBytes)) {
              lastUpdateTime = now;

              const loadedMb = (receivedBytes / (1024 * 1024)).toFixed(1);
              const totalMb = totalBytes > 0 ? (totalBytes / (1024 * 1024)).toFixed(1) : "";
              const subtitle = totalBytes > 0 ? `${loadedMb} MB / ${totalMb} MB` : `${loadedMb} MB downloaded`;

              updateTask(taskId, {
                loadedBytes: receivedBytes,
                totalBytes: totalBytes > 0 ? totalBytes : undefined,
                subtitle,
                indeterminate: totalBytes <= 0,
              });

              if (options?.onProgress && totalBytes > 0) {
                options.onProgress(Math.round((receivedBytes / totalBytes) * 100), receivedBytes, totalBytes);
              }
            }
          }
        }

        updateTask(taskId, { subtitle: "Finalizing file...", progress: 98 });

        const blobType = options?.mimeType || response.headers.get("content-type") || "application/octet-stream";
        const finalBlob = new Blob(chunks, { type: blobType });

        completeTask(taskId, `Saved ${(finalBlob.size / (1024 * 1024)).toFixed(1)} MB`);
        triggerBrowserDownload(finalBlob, filename, blobType);
        return finalBlob;
      } catch (err: any) {
        if (err.name === "AbortError") {
          cancelTask(taskId);
          return null;
        }
        failTask(taskId, err.message || "Download failed.");
        throw err;
      }
    },
    [startTask, updateTask, completeTask, failTask, cancelTask]
  );

  return (
    <TaskProgressContext.Provider
      value={{
        tasks,
        activeTasks,
        isAnyTaskRunning,
        globalProgress,
        startTask,
        updateTask,
        completeTask,
        failTask,
        cancelTask,
        dismissTask,
        clearCompletedTasks,
        runTrackedTask,
        downloadWithProgress,
      }}
    >
      {children}
    </TaskProgressContext.Provider>
  );
}

export function useTaskProgress() {
  const context = useContext(TaskProgressContext);
  if (!context) {
    throw new Error("useTaskProgress must be used within a TaskProgressProvider");
  }
  return context;
}

// Browser helper to trigger native file save from Blob
export function triggerBrowserDownload(blob: Blob, filename: string, mimeType?: string) {
  const typedBlob = mimeType ? new Blob([blob], { type: mimeType }) : blob;
  const objectUrl = URL.createObjectURL(typedBlob);
  const link = document.createElement("a");
  link.style.display = "none";
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(objectUrl);
  }, 2500);
}
