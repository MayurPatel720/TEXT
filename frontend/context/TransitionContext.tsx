"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

type TransitionState = "idle" | "covering" | "covered" | "revealing";

interface TransitionContextType {
  state: TransitionState;
  triggerTransition: (callback?: () => void) => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TransitionState>("idle");
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  const triggerTransition = useCallback((callback?: () => void) => {
    setState("covering");
    
    // Time for the "cover" animation to complete
    setTimeout(() => {
      setState("covered");
      if (callback) callback();
      
      // Start revealing after a tiny delay or path change
      setTimeout(() => {
        setState("revealing");
        setTimeout(() => setState("idle"), 800); // Revealing duration
      }, 100);
    }, 800); // Covering duration
  }, []);

  // Auto-trigger on pathname change
  useEffect(() => {
    if (pathname !== prevPathname) {
      setPrevPathname(pathname);
      // If we're not already transitioning, start the revealing phase
      // This handles standard link navigations
      if (state === "idle") {
        setState("revealing");
        setTimeout(() => setState("idle"), 800);
      }
    }
  }, [pathname, prevPathname, state]);

  return (
    <TransitionContext.Provider value={{ state, triggerTransition }}>
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  const context = useContext(TransitionContext);
  if (context === undefined) {
    throw new Error("useTransition must be used within a TransitionProvider");
  }
  return context;
}
