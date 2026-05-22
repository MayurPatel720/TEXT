"use client";

import React, { createContext, useContext } from "react";

type TransitionState = "idle";

interface TransitionContextType {
  state: TransitionState;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  return (
    <TransitionContext.Provider value={{ state: "idle" }}>
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  const context = useContext(TransitionContext);
  if (context === undefined) {
    throw new Error("useTransition must be used within a TransitionProvider");
  }
  const triggerTransition = (callback?: () => void) => {
    if (callback) callback();
  };
  return { ...context, triggerTransition };
}
