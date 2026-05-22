"use client";

import { motion } from "framer-motion";
import { Sparkles, Upload, Palette, Download, ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { useRouter } from "next/navigation";
import { PricingSection } from "@/components/PricingSection";
import HeroGallery from "@/components/HeroGallery";

const CATEGORY_COLORS: Record<string, string> = {
  Saree: "from-pink-500/20 to-rose-500/20 border-pink-500/30",
  "Dress Material": "from-purple-500/20 to-violet-500/20 border-purple-500/30",
  Suiting: "from-blue-500/20 to-indigo-500/20 border-blue-500/30",
  Shawl: "from-orange-500/20 to-amber-500/20 border-orange-500/30",
  Lehenga: "from-red-500/20 to-rose-500/20 border-red-500/30",
  Print: "from-teal-500/20 to-cyan-500/20 border-teal-500/30",
  Jacquard: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30",
  Embroidery: "from-emerald-500/20 to-green-500/20 border-emerald-500/30",
  Bafta: "from-neutral-500/20 to-stone-500/20 border-neutral-500/30",
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

const DESCRIPTIONS: Record<string, string> = {
  Saree: "Traditional elegance, modern prints",
  "Dress Material": "Trendy fabrics for every occasion",
  Suiting: "Sharp textiles for tailored fits",
  Shawl: "Warmth meets intricate design",
  Lehenga: "Bridal and festive grandeur",
  Print: "Bold patterns, endless repeats",
  Jacquard: "Woven luxury, rich texture",
  Embroidery: "Threadwork magic, raised detail",
  Bafta: "Pure cotton, everyday comfort",
};

const STEPS = [
  { icon: <Upload className="w-8 h-8" />, title: "Upload your fabric image", desc: "Reference photo, sketch, or existing fabric" },
  { icon: <Palette className="w-8 h-8" />, title: "Choose your style", desc: "Pick category, workflow, and preferences" },
  { icon: <Download className="w-8 h-8" />, title: "Download print-ready pattern", desc: "HD seamless designs, ready for production" },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      <HeroGallery />

      {/* Category Showcase */}
      <section id="features" className="section scroll-mt-20">
        <div className="section-container">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-4 text-[var(--text-primary)]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Design for every textile
          </motion.h2>
          <motion.p
            className="text-center text-[var(--text-secondary)] mb-12 max-w-lg mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            From traditional sarees to modern prints — pick your fabric and let AI do the rest
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => router.push(`/studio?category=${cat.toLowerCase()}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    router.push(`/studio?category=${cat.toLowerCase()}`);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`relative p-6 flex flex-col h-full rounded-2xl bg-gradient-to-br ${CATEGORY_COLORS[cat]} border text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg fabric-overlay overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]`}
              >
                <div className="relative z-10">
                  <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2">{cat}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{DESCRIPTIONS[cat]}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section scroll-mt-20 bg-[var(--bg-secondary)]/50">
        <div className="section-container">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-4 text-[var(--text-primary)]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            3 Simple Steps
          </motion.h2>
          <motion.p
            className="text-center text-[var(--text-secondary)] mb-12 max-w-lg mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            From upload to design in under 10 seconds
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] mb-5">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      <Footer />

      {/* Sticky Mobile CTA - sits above BottomTab */}
      <div className="fixed bottom-16 left-0 right-0 z-50 md:hidden safe-area-bottom bg-[var(--bg-elevated)] border-t border-[var(--border)] px-4 py-3">
        <button
          onClick={() => router.push("/studio")}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white font-semibold flex items-center justify-center gap-2 shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          Start Creating Free
        </button>
      </div>
    </main>
  );
}
