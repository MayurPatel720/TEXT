"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";

// List of common disposable/temporary email domains
const disposableEmailDomains = [
  // Common temporary email services
  "tempmail.com", "temp-mail.org", "tempmailo.com", "tempmailaddress.com",
  "10minutemail.com", "10minutemail.net", "10minmail.com",
  "guerrillamail.com", "guerrillamail.org", "guerrillamail.net", "guerrillamail.biz",
  "mailinator.com", "mailinator.net", "mailinator.org", "mailinator2.com",
  "throwaway.email", "throwawaymail.com",
  "yopmail.com", "yopmail.fr", "yopmail.net",
  "fakeinbox.com", "fakemailgenerator.com",
  "getnada.com", "nada.email",
  "maildrop.cc", "mailnesia.com",
  "trashmail.com", "trashmail.net", "trashmail.org",
  "dispostable.com", "disposableemailaddresses.com",
  "sharklasers.com", "spam4.me", "spamgourmet.com",
  "mailcatch.com", "mytrashmail.com",
  "tempinbox.com", "tempr.email", "discard.email",
  "discardmail.com", "spamfree24.org", "spamfree.eu",
  "getairmail.com", "mohmal.com", "emailondeck.com",
  "mintemail.com", "tempail.com", "emailfake.com",
  "crazymailing.com", "tempsky.com",
  "burnermail.io", "guerrillamailblock.com",
  "mailsac.com", "inboxkitten.com",
  "33mail.com", "anonaddy.com",
  "jetable.org", "mailexpire.com",
  "spamex.com", "spamspot.com",
  "trbvm.com", "armyspy.com", "cuvox.de",
  "dayrep.com", "einrot.com", "fleckens.hu",
  "gustr.com", "jourrapide.com", "rhyta.com",
  "superrito.com", "teleworm.us",
  // Indian temporary mail services
  "mailfreeonline.com", "mail-temporaire.fr",
  "tmails.net", "tmpmail.org", "tmpmail.net",
  "disbox.org", "disbox.net", "dropmail.me",
  "wegwerfemail.de", "sofort-mail.de",
  "trash-mail.at", "trash-mail.com",
];

// Validation schema with Yup
const SignupSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .matches(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
    .required("Full name is required"),
  
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required")
    .test(
      "not-disposable",
      "Temporary or disposable emails are not allowed. Please use a real email address.",
      (value) => {
        if (!value) return true;
        const domain = value.split("@")[1]?.toLowerCase();
        return !disposableEmailDomains.includes(domain);
      }
    )
    .test(
      "valid-domain",
      "Please use a valid email provider",
      (value) => {
        if (!value) return true;
        const domain = value.split("@")[1]?.toLowerCase();
        // Check for suspicious patterns
        if (!domain) return false;
        // Must have at least one dot in domain
        if (!domain.includes(".")) return false;
        // Domain shouldn't be too short
        if (domain.length < 4) return false;
        return true;
      }
    ),
  
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .required("Password is required"),
});

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center relative">
              <Image src="/logo.png" alt="FabricDesigner.AI" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-bold text-lg">FabricDesigner.AI</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Create an account</h1>
          <p className="text-[var(--text-secondary)]">Start designing in seconds</p>
        </div>

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

              // Auto-login after signup
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

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <Field
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none transition-all ${
                    errors.name && touched.name
                      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-white/10 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  }`}
                />
                <ErrorMessage
                  name="name"
                  component="p"
                  className="mt-1.5 text-xs text-red-400"
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <Field
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none transition-all ${
                    errors.email && touched.email
                      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-white/10 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  }`}
                />
                <ErrorMessage
                  name="email"
                  component="p"
                  className="mt-1.5 text-xs text-red-400"
                />
                <p className="text-xs text-white/40 mt-1">Use a real email address (no temporary emails)</p>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
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

              <button
                type="submit"
                disabled={isSubmitting || status?.success}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[#0052cc] text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--accent)]/20"
              >
                {isSubmitting ? "Creating account..." : status?.success ? "Success!" : "Create Account"}
              </button>
            </Form>
          )}
        </Formik>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--bg-elevated)] px-2 text-[var(--text-tertiary)]">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={handleGoogleSignIn}
            className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
          >
            <Mail className="w-4 h-4" />
            Continue with Google
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
