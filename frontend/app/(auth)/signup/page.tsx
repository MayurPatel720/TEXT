"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Button, Input } from "@heroui/react";

function AuthError() {
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  if (!authError) return null;

  let errorMessage = "Authentication failed. Please try again.";
  if (authError === "AccessDenied") {
    errorMessage = "Access denied. Could not create or link the account.";
  } else if (authError === "Configuration") {
    errorMessage = "Server configuration error.";
  }

  return (
    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm mb-4">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {errorMessage}
    </div>
  );
}

const disposableEmailDomains = [
  "tempmail.com", "temp-mail.org", "10minutemail.com", "mailinator.com",
  "guerrillamail.com", "yopmail.com", "throwaway.email", "maildrop.cc",
  "trashmail.com", "sharklasers.com", "getnada.com", "emailondeck.com",
  "mintemail.com", "tempail.com", "emailfake.com", "burnermail.io",
  "mailsac.com", "anonaddy.com", "spamgourmet.com", "dispostable.com",
  "mailexpire.com", "jetable.org", "wegwerfemail.de", "mohmal.com",
  "inboxkitten.com", "fexpost.com", "1secmail.com", "moakt.com",
];

const SignupSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .matches(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
    .required("Full name is required"),

  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required")
    .test("not-disposable", "Temporary or disposable emails are not allowed. Please use a real email address.", (value) => {
      if (!value) return true;
      const domain = value.split("@")[1]?.toLowerCase();
      return !disposableEmailDomains.includes(domain);
    }),

  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .required("Password is required"),
});

export default function SignupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

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
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Create an account</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Start designing in seconds</p>
        </div>

        <Suspense fallback={null}>
          <AuthError />
        </Suspense>

        <Formik
          initialValues={{ name: "", email: "", password: "" }}
          validationSchema={SignupSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            try {
              const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
              });

              const data = await response.json();

              if (!response.ok) {
                setStatus({ error: data.error || "Signup failed" });
                toast.error(data.error || "Signup failed");
                return;
              }

              setStatus({ success: true });
              toast.success("Account created! Redirecting...");

              setTimeout(async () => {
                await signIn("credentials", {
                  email: values.email,
                  password: values.password,
                  redirect: false,
                });
                router.push("/");
              }, 1500);
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
                  Account created! Redirecting...
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Full Name</label>
                <Field name="name">
                  {({ field }: any) => (
                    <Input
                      type="text"
                      placeholder="John Doe"
                      {...field}
                      isInvalid={errors.name && touched.name}
                      className="w-full"
                    />
                  )}
                </Field>
                <ErrorMessage name="name" component="p" className="mt-1.5 text-xs text-red-400" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Email</label>
                <Field name="email">
                  {({ field }: any) => (
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                      isInvalid={errors.email && touched.email}
                      className="w-full"
                    />
                  )}
                </Field>
                <ErrorMessage name="email" component="p" className="mt-1.5 text-xs text-red-400" />
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Use a real email address (no temporary emails)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Password</label>
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

              <Button
                type="submit"
                isDisabled={isSubmitting || status?.success}
                fullWidth
                className="py-6 font-semibold text-base border-none"
                style={{ background: 'var(--accent)', color: 'white', boxShadow: '0 4px 14px var(--accent-glow)' }}
              >
                {isSubmitting ? "Creating account..." : status?.success ? "Success!" : "Create Account"}
              </Button>
            </Form>
          )}
        </Formik>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: 'var(--border)' }}></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2" style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}>Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button onPress={handleGoogleSignIn} variant="outline" fullWidth className="py-5">
            <Mail className="w-4 h-4" />
            Google
          </Button>
          <Button onPress={() => signIn("github", { callbackUrl: "/" })} variant="outline" fullWidth className="py-5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
            GitHub
          </Button>
        </div>

        <div className="mt-8 text-center text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link href="/login" className="hover:underline font-medium" style={{ color: 'var(--accent)' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
