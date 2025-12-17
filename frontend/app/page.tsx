"use client";

import { motion } from "framer-motion";
import { 
  Sparkles, 
  Zap, 
  Download, 
  Palette, 
  ArrowRight,
  Star,
  Check
} from "lucide-react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { PricingSection } from "@/components/PricingSection";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--accent)] opacity-10 blur-[150px] rounded-full" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500 opacity-5 blur-[100px] rounded-full" />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="mb-8">
              <span className="badge badge-accent">
                <Zap className="w-3 h-3" />
                Powered by Flux AI
              </span>
            </motion.div>
            
            {/* Headline */}
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            >
              Generate stunning
              <span className="block gradient-text-accent">textile designs</span>
              with AI
            </motion.h1>
            
            {/* Subheadline */}
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10"
            >
              Upload your reference pattern. Get print-ready variations in seconds. 
              No design skills needed.
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <Link href="/studio">
                <button className="btn btn-primary btn-lg animate-pulse-glow">
                  Start Creating Free
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <button className="btn btn-secondary btn-lg">
                Watch Demo
              </button>
            </motion.div>
            
            {/* Stats */}
            <motion.div 
              variants={fadeInUp}
              className="flex items-center justify-center gap-8 text-sm text-[var(--text-secondary)]"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border-2 border-[var(--bg-primary)]" />
                  ))}
                </div>
                <span>2,000+ designers</span>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-1">4.9/5 rating</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 rounded-full border-2 border-[var(--border)] flex items-start justify-center p-2"
          >
            <div className="w-1.5 h-2.5 bg-[var(--text-secondary)] rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need
            </h2>
            <p className="text-xl text-[var(--text-secondary)]">
              From reference image to print-ready designs in 3 simple steps
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Palette className="w-6 h-6" />,
                title: "Style Transfer",
                description: "Upload any fabric reference. Our AI captures the style, colors, and patterns to create matching designs.",
                color: "var(--accent)"
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Instant Variations",
                description: "Generate 4-8 unique variations in under 15 seconds. Each one perfectly printable.",
                color: "#00C853"
              },
              {
                icon: <Download className="w-6 h-6" />,
                title: "Print-Ready Export",
                description: "Download in HD resolution. Ready for professional textile printing at 300+ DPI.",
                color: "#FF6B00"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-8 hover:border-[var(--border-hover)]"
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: `${feature.color}20`, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-[var(--text-secondary)]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-xl text-[var(--text-secondary)]">
              Three steps to professional textile designs
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Upload Reference",
                description: "Drag and drop your reference fabric image. JPG or PNG, any resolution."
              },
              {
                step: "02",
                title: "Describe & Customize",
                description: "Write what you want. Adjust style strength, colors, and pattern density."
              },
              {
                step: "03",
                title: "Generate & Download",
                description: "Get instant variations. Select favorites and download in HD."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="text-6xl font-bold gradient-text-accent mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-[var(--text-secondary)]">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[var(--accent)] opacity-10 blur-[150px] rounded-full" />
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to transform your designs?
            </h2>
            <p className="text-xl text-[var(--text-secondary)] mb-10">
              Join thousands of textile professionals using AI to create stunning patterns.
            </p>
            <Link href="/studio">
              <button className="btn btn-primary btn-lg animate-pulse-glow">
                Start Creating Now
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
