"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
const iconColor = {
  success: "text-good-ink",
  error: "text-critical-ink",
  info: "text-link",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = icons[t.type];
            return (
              <motion.div
                key={t.id}
                role={t.type === "error" ? "alert" : "status"}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6, transition: { duration: 0.15, ease: "easeOut" } }}
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                className="pointer-events-auto flex items-start gap-3 rounded-lg bg-popover px-4 py-3 text-popover-foreground shadow-overlay"
              >
                <Icon className={cn("mt-0.5 size-4 shrink-0", iconColor[t.type])} aria-hidden />
                <p className="flex-1 text-sm">{t.message}</p>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => removeToast(t.id)}
                  className="relative -mr-1 shrink-0 rounded p-0.5 text-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
