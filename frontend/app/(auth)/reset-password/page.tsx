"use client";

import Link from "next/link";
import Image from "next/image";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Button, Input } from "@heroui/react";

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

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setTokenError("No reset token provided. Please request a new password reset link.");
      return;
    }

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
        <p style={{ color: 'var(--text-secondary)' }}>Verifying reset link...</p>
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
          className="inline-block px-6 py-2.5 rounded-xl font-medium hover:opacity-90 transition-all" style={{ backgroundColor: 'var(--accent)', color: 'white' }}
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

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>New Password</label>
            <div className="relative">
              <Field name="password">
                {({ field }: any) => (
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...field}
                    isInvalid={errors.password && touched.password}
                    className="w-full"
                  />
                )}
              </Field>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-tertiary)' }}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <ErrorMessage name="password" component="p" className="mt-1.5 text-xs text-red-400" />
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Min 8 characters with uppercase, lowercase & number
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Confirm Password</label>
            <div className="relative">
              <Field name="confirmPassword">
                {({ field }: any) => (
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...field}
                    isInvalid={errors.confirmPassword && touched.confirmPassword}
                    className="w-full"
                  />
                )}
              </Field>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-tertiary)' }}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <ErrorMessage name="confirmPassword" component="p" className="mt-1.5 text-xs text-red-400" />
          </div>

          <Button
            type="submit"
            isDisabled={isSubmitting || status?.success}
            fullWidth
            className="py-6 font-semibold text-base border-none"
            style={{ background: 'var(--accent)', color: 'white', boxShadow: '0 4px 14px var(--accent-glow)' }}
          >
            {isSubmitting ? "Resetting..." : status?.success ? "Success!" : "Reset Password"}
          </Button>
        </Form>
      )}
    </Formik>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'var(--accent)', opacity: 0.05, filter: 'blur(120px)' }} />

      <div className="w-full max-w-md relative z-10 border rounded-2xl shadow-xl p-8" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center relative">
              <Image src="/logo.png" alt="FabricDesigner.AI" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>FabricDesigner.AI</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Reset your password</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Enter your new password below</p>
        </div>

        <Suspense fallback={
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>

        <div className="mt-8 text-center text-sm">
          <Link href="/login" className="hover:underline font-medium" style={{ color: 'var(--accent)' }}>
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
