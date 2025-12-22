"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send reset email");
        toast.error(data.error || "Failed to send reset email");
        return;
      }

      setSuccess(true);
      setResetLink(data.resetLink); // For dev mode
      toast.success("Reset link sent! Check your email.");
      
      // Log link to console for easy access
      if (data.resetLink) {
        console.log('\n📧 RESET LINK (dev mode):', data.resetLink);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)] opacity-5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-8 relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center relative">
              <Image src="/logo.png" alt="FabricDesigner.AI" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-bold text-lg">FabricDesigner.AI</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Reset password</h1>
          <p className="text-[var(--text-secondary)]">Enter your email to receive a reset link</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Check your email!</span>
            </div>
            <p className="text-green-400/70 text-xs mb-3">
              If an account exists with this email, you will receive a password reset link shortly.
            </p>
            {resetLink && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-xs mb-2 font-medium">
                  ⚠️ Development Mode - Email not configured
                </p>
                <p className="text-yellow-400/70 text-xs mb-2">
                  Add EMAIL_USER and EMAIL_PASS to your .env.local to send real emails.
                </p>
                <div className="mt-2 p-2 bg-[var(--bg-primary)] rounded border border-yellow-500/10">
                  <p className="text-[var(--text-tertiary)] text-xs mb-1">Reset Link:</p>
                  <code className="text-yellow-300 text-xs break-all block">{resetLink}</code>
                </div>
              </div>
            )}
          </div>
        )}

        {!success && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input 
                type="email" 
                className="input w-full" 
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit"
              className="btn btn-primary w-full py-2.5"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm">
          <Link href="/login" className="text-[var(--accent)] hover:underline font-medium">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
