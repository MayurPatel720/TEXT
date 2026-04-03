"use client";

import { motion } from "framer-motion";

export const TextileBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Soft gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/60 to-purple-50/40" />
      
      {/* Grid pattern resembling light fabric weave */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: 'linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <svg
        className="absolute w-[200%] h-[200%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.15]"
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        {/* Thread 1 */}
        <motion.path
          d="M 0,500 C 250,400 350,600 500,500 C 650,400 750,600 1000,500"
          stroke="var(--accent)"
          strokeWidth="2.5"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: [0.3, 0.7, 0.3],
            d: [
              "M 0,500 C 250,400 350,600 500,500 C 650,400 750,600 1000,500",
              "M 0,500 C 200,450 400,550 500,500 C 600,450 800,550 1000,500",
              "M 0,500 C 250,400 350,600 500,500 C 650,400 750,600 1000,500"
            ]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Thread 2 */}
        <motion.path
          d="M 0,450 C 300,350 400,650 600,550 C 800,450 900,550 1000,450"
          stroke="#8B5CF6"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: [0.2, 0.6, 0.2],
            d: [
              "M 0,450 C 300,350 400,650 600,550 C 800,450 900,550 1000,450",
              "M 0,450 C 350,400 450,600 600,550 C 750,500 850,500 1000,450",
              "M 0,450 C 300,350 400,650 600,550 C 800,450 900,550 1000,450"
            ]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Thread 3 (Vertical weaving) */}
        <motion.path
          d="M 400,0 C 500,250 300,350 400,500 C 500,650 300,750 400,1000"
          stroke="url(#gradientThread)"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1, 
            opacity: [0.4, 0.8, 0.4],
            y: [-20, 20, -20]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <defs>
          <linearGradient id="gradientThread" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>
      {/* Floating abstract fabric shapes */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[var(--accent)] to-purple-400 opacity-5 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-3xl"
        animate={{
          rotate: [0, 90, 180, 270, 360],
          borderRadius: [
            "40% 60% 70% 30% / 40% 50% 60% 50%",
            "60% 40% 30% 70% / 50% 60% 40% 50%",
            "40% 60% 70% 30% / 40% 50% 60% 50%"
          ]
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};
