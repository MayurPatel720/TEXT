"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Shield, Palette, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { useRouter } from "next/navigation";
import { useTransition } from "@/context/TransitionContext";


export default function HomePage() {
  const router = useRouter();
  const { triggerTransition } = useTransition();
  
  return (

    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden z-10">
        {/* Animated gradient background */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 opacity-30 pointer-events-none"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
        
        {/* Floating orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 mb-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Powered by AI
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                Professional Textile Design<br />in Seconds
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-[var(--text-secondary)] mb-12 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Transform your reference images into stunning, print-ready fabric patterns with AI. FabricDesigner.AI makes textile design faster, smarter, and more creative.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <button 
                onClick={() => triggerTransition(() => router.push("/studio"))}
                className="btn btn-primary btn-lg group"
              >
                <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
                Start Designing Free
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>

              
              <Link href="#features" className="btn btn-secondary btn-lg">
                See How It Works
              </Link>
            </motion.div>
            
            <motion.p 
              className="text-sm text-[var(--text-tertiary)] mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              ✨ Free credits on signup • No credit card required
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 bg-clip-text text-transparent">
                Why Choose
              </span>
              <br />
              <span className="text-white">FabricDesigner.AI?</span>
            </h2>
            <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed">
              Professional-grade textile design tools powered by cutting-edge AI technology
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <FeatureCard
              icon={<Zap className="w-10 h-10" />}
              title="Lightning Fast"
              description="Generate professional textile designs in seconds, not hours. AI-powered speed meets human creativity."
              delay={0}
            />
            
            <FeatureCard
              icon={<Palette className="w-10 h-10" />}
              title="Print-Ready Quality"
              description="High-resolution, professionally optimized patterns ready for textile manufacturing. Perfect colors, seamless tiles."
              delay={0.1}
            />
            
            <FeatureCard
              icon={<Shield className="w-10 h-10" />}
              title="Secure & Private"
              description="Your designs stay yours. Bank-level security, private generations, complete ownership of all outputs."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-teal-400 to-green-400 bg-clip-text text-transparent">
                Stunning Results
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-[var(--text-secondary)]">
              See what's possible with AI-powered textile design
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <ShowcaseCard
              title="Floral Patterns"
              description="Intricate, seamless floral designs for premium fabrics"
              gradient="from-pink-500/20 to-purple-500/20"
              icon={<Palette className="w-12 h-12 text-pink-400" />}
            />
            <ShowcaseCard
              title="Geometric Designs"
              description="Modern, bold geometric patterns for contemporary textiles"
              gradient="from-blue-500/20 to-teal-500/20"
              icon={<Sparkles className="w-12 h-12 text-teal-400" />}
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-white">Simple Pricing</span>
            </h2>
            <p className="text-xl md:text-2xl text-[var(--text-secondary)]">
              Choose the plan that fits your needs
            </p>
          </div>
          
          <PricingToggle />
        </div>
      </section>

      <Footer />
    </main>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode; title: string; description: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="group relative h-full"
    >
      <div className="relative p-10 h-full rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-500 flex flex-col">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-blue-500/0 to-teal-500/0 group-hover:from-purple-500/5 group-hover:via-blue-500/5 group-hover:to-teal-500/5 transition-all duration-500 pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 border border-[var(--border)] border-opacity-20">
            <div className="text-purple-400 group-hover:text-blue-400 transition-colors duration-500 [&>svg]:w-8 [&>svg]:h-8">{icon}</div>
          </div>
          <h3 className="text-2xl font-bold mb-4 group-hover:text-white transition-colors duration-300">{title}</h3>
          <p className="text-[var(--text-secondary)] leading-relaxed text-lg">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ShowcaseCard({ title, description, gradient, icon }: { title: string; description: string; gradient: string; icon: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />
      <div className="absolute inset-0 bg-[var(--bg-card)] -z-10" />
      
      <div className="absolute inset-0 border border-[var(--border)] rounded-3xl group-hover:border-[var(--border-hover)] transition-colors duration-500 pointer-events-none" />

      <div className="h-full flex flex-col justify-between p-10 relative z-10">
        <div className="w-20 h-20 rounded-2xl bg-[var(--bg-elevated)]/50 backdrop-blur-sm border border-[var(--border)] flex items-center justify-center transform group-hover:-translate-y-2 transition-transform duration-500">
          {icon}
        </div>

        <div>
          <h3 className="text-3xl font-bold mb-3 text-white group-hover:translate-x-2 transition-transform duration-300">{title}</h3>
          <p className="text-lg text-[var(--text-secondary)] max-w-md group-hover:text-white transition-colors duration-300">{description}</p>
        </div>
      </div>
      
      {/* Hover Glow */}
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-colors duration-500 pointer-events-none" />
    </motion.div>
  );
}

function PricingCard({ name, price, priceUnit, description, features, cta, href, highlighted, badge }: {
  name: string;
  price: string;
  priceUnit?: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted: boolean;
  badge?: string;
}) {
  const router = useRouter();
  const { triggerTransition } = useTransition();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative p-8 rounded-3xl border flex flex-col h-full transition-all duration-300 ${
        highlighted 
          ? 'bg-[var(--bg-card)] border-[var(--accent)] shadow-[0_0_40px_-10px_var(--accent-glow)]' 
          : 'bg-transparent border-[var(--border)] hover:border-[var(--border-hover)]'
      }`}
    >
      {badge && (
        <div className="absolute -top-4 left-8 px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold tracking-wider uppercase shadow-lg">
          {badge}
        </div>
      )}
      
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-2 text-white">{name}</h3>
        <p className="text-[var(--text-secondary)] text-sm">{description}</p>
      </div>

      <div className="mb-8 flex items-baseline gap-1">
        <span className="text-4xl md:text-5xl font-bold text-white tracking-tight">{price}</span>
        {priceUnit && <span className="text-[var(--text-secondary)]">{priceUnit}</span>}
      </div>
      
      <ul className="space-y-4 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className={`mt-1 rounded-full p-0.5 ${highlighted ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400'}`}>
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className={`text-sm ${highlighted ? 'text-gray-200' : 'text-gray-400'}`}>{feature}</span>
          </li>
        ))}
      </ul>
      
      <button 
        onClick={() => {
          if (href.startsWith("mailto:")) {
            window.location.href = href;
          } else {
            triggerTransition(() => router.push(href));
          }
        }}
        className={`btn w-full py-4 rounded-xl font-semibold text-center transition-all duration-300 ${
          highlighted 
            ? 'btn-primary' 
            : 'bg-transparent border border-[var(--border)] text-white hover:bg-[var(--bg-elevated)]'
        }`}
      >
        {cta}
      </button>
    </motion.div>
  );
}


function PricingToggle() {
  const [isYearly, setIsYearly] = useState(false);
  
  return (
    <>
      <div className="flex items-center justify-center gap-4 mb-16">
        <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
          Monthly
        </span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className="relative w-16 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-[var(--accent)] transition-transform duration-300 shadow-md ${isYearly ? 'translate-x-8' : 'translate-x-0'}`} />
        </button>
        <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
          Yearly
          <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 uppercase tracking-wide">Save 20%</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
        <PricingCard
          name="Free"
          price="$0"
          priceUnit="/mo"
          description="Perfect for trying out"
          features={[
            "10 free credits",
            "All design features",
            "High-resolution exports",
            "Email support"
          ]}
          cta="Get Started Free"
          href="/register"
          highlighted={false}
        />
        
        <PricingCard
          name="Pro"
          price={isYearly ? "$19" : "$24"}
          priceUnit="/mo"
          description="For professional designers"
          features={[
            "200 credits/month",
            "Priority generation",
            "Advanced AI models",
            "Commercial license",
            "Priority support"
          ]}
          cta="Start Pro"
          href="/studio"
          highlighted={true}
          badge="POPULAR"
        />
        
        <PricingCard
          name="Business"
          price={isYearly ? "$79" : "$99"}
          priceUnit="/mo"
          description="For design teams"
          features={[
            "1000 credits/month",
            "Team collaboration",
            "Custom branding",
            "API access",
            "Dedicated support",
            "Analytics dashboard"
          ]}
          cta="Start Business"
          href="/studio"
          highlighted={false}
        />
        
        <PricingCard
          name="Enterprise"
          price="Custom"
          description="For large organizations"
          features={[
            "Unlimited credits",
            "Custom AI training",
            "White-label solution",
            "SLA guarantee",
            "Dedicated account manager",
            "Custom integrations"
          ]}
          cta="Contact Sales"
          href="mailto:sales@fabricdesigner.ai"
          highlighted={false}
        />
      </div>
    </>
  );
}
