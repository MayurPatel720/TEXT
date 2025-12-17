"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";
import Script from "next/script";

export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Starter",
      price: { monthly: "₹0", yearly: "₹0" },
      period: "forever",
      features: ["5 generations", "Standard quality", "JPG downloads"],
      cta: "Get Started",
      popular: false,
      action: () => window.location.href = "/studio"
    },
    {
      name: "Pro",
      price: { monthly: "₹2,499", yearly: "₹24,999" },
      period: billing === "monthly" ? "/month" : "/year",
      originalPrice: billing === "yearly" ? "₹29,988" : null,
      saveLabel: billing === "yearly" ? "Save 20%" : null,
      features: ["100 generations/mo", "HD quality", "PNG & TIFF", "Priority queue", "History saved"],
      cta: "Start Pro Trial",
      popular: true,
      action: () => handlePayment(billing === "monthly" ? "pro_monthly" : "pro_yearly")
    },
    {
      name: "Enterprise",
      price: { monthly: "Custom", yearly: "Custom" },
      period: "",
      features: ["Unlimited generations", "API access", "Custom models", "Dedicated support"],
      cta: "Contact Sales",
      popular: false,
      action: () => window.location.href = "mailto:sales@textileai.com"
    }
  ];

  const handlePayment = async (planId: string) => {
    try {
      // Get user session
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      
      if (!session?.user) {
        // Redirect to login
        window.location.href = '/login';
        return;
      }

      // Create order
      const orderResponse = await fetch(`/api/payment?planId=${planId}`);
      const orderData = await orderResponse.json();

      if (!orderData.success) {
        alert('Failed to create order. Please try again.');
        return;
      }

      // Check if Razorpay script is loaded
      if (typeof window === 'undefined' || !(window as any).Razorpay) {
        alert('Payment system is loading. Please wait a moment and try again.');
        return;
      }

      // Initialize Razorpay
      const options = {
        key: orderData.razorpayKey,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Textile AI",
        description: orderData.order.planName,
        order_id: orderData.order.id,
        handler: async function (response: any) {
          // Process payment on backend
          const verifyResponse = await fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              planId,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            alert(`Success! ${orderData.order.credits} credits added to your account.`);
            window.location.href = '/studio';
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          email: session.user.email,
          name: session.user.name,
        },
        theme: {
          color: "#6366f1",
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    }
  };

  return (
    <section id="pricing" className="py-32 relative">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple pricing</h2>
          <p className="text-xl text-[var(--text-secondary)] mb-8">
            Start free. Scale as you grow.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${billing === "monthly" ? "text-white" : "text-[var(--text-secondary)]"}`}>Monthly</span>
            <button
              onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
              className="w-14 h-7 bg-[var(--bg-elevated)] rounded-full border border-[var(--border)] relative transition-colors hover:border-[var(--accent)]"
            >
              <motion.div
                className="w-5 h-5 bg-[var(--accent)] rounded-full absolute top-1 left-1"
                animate={{ x: billing === "monthly" ? 0 : 28 }}
              />
            </button>
            <span className={`text-sm font-medium ${billing === "yearly" ? "text-white" : "text-[var(--text-secondary)]"}`}>
              Yearly <span className="text-[var(--accent)] text-xs ml-1">(Save 20%)</span>
            </span>
          </div>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`card p-8 relative ${plan.popular ? 'border-[var(--accent)] glow-accent' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge badge-accent">Most Popular</span>
                </div>
              )}
              <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
              <div className="mb-6 h-16">
                {plan.originalPrice && (
                  <div className="text-sm text-[var(--text-secondary)] line-through decoration-red-500">
                    {plan.originalPrice}
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{billing === "monthly" ? plan.price.monthly : plan.price.yearly}</span>
                  <span className="text-[var(--text-secondary)]">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 h-48">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Check className="w-4 h-4 text-[var(--success)]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={plan.action}
                className={`btn w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
