"use client";

import Link from "next/link";
import { Sparkles, Github, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      setSuccess(true);
      
      // Auto-login after signup
      setTimeout(async () => {
        await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        router.push("/");
      }, 1500);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)] opacity-5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-8 relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">FabricDesigner.AI</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Create an account</h1>
          <p className="text-[var(--text-secondary)]">Start designing in seconds</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Account created! Redirecting...
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <input 
              type="text" 
              className="input w-full" 
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
          
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input 
              type="password" 
              className="input w-full" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Minimum 6 characters</p>
          </div>

          <button 
            type="submit"
            className="btn btn-primary w-full py-2.5"
            disabled={loading || success}
          >
            {loading ? "Creating account..." : success ? "Success!" : "Create Account"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--bg-elevated)] px-2 text-[var(--text-tertiary)]">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleGoogleSignIn}
            className="btn btn-secondary py-2 flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Google
          </button>
          <button className="btn btn-secondary py-2 flex items-center justify-center gap-2" disabled>
            <Github className="w-4 h-4" />
            GitHub
          </button>
        </div>

        <div className="mt-8 text-center text-sm">
          <span className="text-[var(--text-secondary)]">Already have an account? </span>
          <Link href="/login" className="text-[var(--accent)] hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
