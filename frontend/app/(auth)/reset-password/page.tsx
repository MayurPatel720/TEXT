"use client";

import Link from "next/link";
import Image from "next/image";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";

// Password validation schema
const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState("");

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setTokenError("No reset token provided. Please request a new password reset link.");
      return;
    }

    // Verify token with API
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();
        
        if (response.ok && data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setTokenError(data.error || "This reset link is invalid or has expired. Please request a new one.");
        }
      } catch (err) {
        setTokenValid(false);
        setTokenError("Failed to verify reset link. Please try again.");
      }
    };

    verifyToken();
  }, [token]);

  if (tokenValid === null) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--text-secondary)]">Verifying reset link...</p>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="text-center">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm">{tokenError}</p>
        </div>
        <Link 
          href="/forgot-password" 
          className="inline-block px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-all"
        >
          Request New Reset Link
        </Link>
      </div>
    );
  }

  return (
    <Formik
      initialValues={{ password: "", confirmPassword: "" }}
      validationSchema={ResetPasswordSchema}
      onSubmit={async (values, { setSubmitting, setStatus }) => {
        try {
          const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password: values.password }),
          });

          const data = await response.json();

          if (!response.ok) {
            setStatus({ error: data.error || "Failed to reset password" });
            toast.error(data.error || "Failed to reset password");
            return;
          }

          setStatus({ success: true });
          toast.success("Password reset successful! Redirecting to login...");

          // Redirect to login after success
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        } catch (err) {
          setStatus({ error: "Something went wrong. Please try again." });
          toast.error("Something went wrong. Please try again.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, status, errors, touched }) => (
        <Form className="space-y-4">
          {status?.error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {status.error}
            </div>
          )}

          {status?.success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Password reset successful! Redirecting to login...
            </div>
          )}

          {/* New Password Field */}
          <div>
            <label className="block text-sm font-medium mb-1.5">New Password</label>
            <div className="relative">
              <Field
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-white/30 focus:outline-none transition-all ${
                  errors.password && touched.password
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-white/10 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <ErrorMessage
              name="password"
              component="p"
              className="mt-1.5 text-xs text-red-400"
            />
            <p className="text-xs text-white/40 mt-1">
              Min 8 characters with uppercase, lowercase & number
            </p>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
            <div className="relative">
              <Field
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="••••••••"
                className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-white/30 focus:outline-none transition-all ${
                  errors.confirmPassword && touched.confirmPassword
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-white/10 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <ErrorMessage
              name="confirmPassword"
              component="p"
              className="mt-1.5 text-xs text-red-400"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || status?.success}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[#0052cc] text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--accent)]/20"
          >
            {isSubmitting ? "Resetting..." : status?.success ? "Success!" : "Reset Password"}
          </button>
        </Form>
      )}
    </Formik>
  );
}

export default function ResetPasswordPage() {
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
          <h1 className="text-2xl font-bold mb-2">Reset your password</h1>
          <p className="text-[var(--text-secondary)]">Enter your new password below</p>
        </div>

        <Suspense fallback={
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">Loading...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>

        <div className="mt-8 text-center text-sm">
          <Link href="/login" className="text-[var(--accent)] hover:underline font-medium">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
