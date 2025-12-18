"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTransition } from "@/context/TransitionContext";

const PATHS = {
  initial: "M 0 100 V 100 Q 50 100 100 100 V 100 z",
  liquid: "M 0 100 V 50 Q 50 0 100 50 V 100 z",
  full: "M 0 100 V 0 Q 50 0 100 0 V 100 z",
  revealStart: "M 0 0 V 100 Q 50 100 100 100 V 0 z",
  revealLiquid: "M 0 0 V 50 Q 50 100 100 50 V 0 z",
  revealEnd: "M 0 0 V 0 Q 50 0 100 0 V 0 z",
};

export default function PageTransition() {
  const { state } = useTransition();

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      <AnimatePresence>
        {(state === "covering" || state === "covered") && (
          <motion.svg
            key="covering-svg"
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="page-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2e1065" />
                <stop offset="50%" stopColor="#5b21b6" />
                <stop offset="100%" stopColor="#4c1d95" />
              </linearGradient>
            </defs>

            <motion.path
              fill="url(#page-grad)"
              initial={{ d: PATHS.initial }}
              animate={{
                d:
                  state === "covered"
                    ? PATHS.full
                    : [PATHS.initial, PATHS.liquid, PATHS.full],
              }}
              transition={{
                duration: 0.8,
                times: [0, 0.5, 1],
                ease: "easeInOut",
              }}
              exit={{ opacity: 0 }}
            />
          </motion.svg>
        )}

        {state === "revealing" && (
          <motion.svg
            key="revealing-svg"
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="page-grad-rev" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4c1d95" />
                <stop offset="50%" stopColor="#5b21b6" />
                <stop offset="100%" stopColor="#2e1065" />
              </linearGradient>
            </defs>

            <motion.path
              fill="url(#page-grad-rev)"
              initial={{ d: PATHS.revealStart }}
              animate={{
                d: [PATHS.revealStart, PATHS.revealLiquid, PATHS.revealEnd],
              }}
              transition={{
                duration: 0.8,
                times: [0, 0.5, 1],
                ease: "easeInOut",
              }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}
