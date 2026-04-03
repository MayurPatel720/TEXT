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
import { useSession } from "next-auth/react";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Component to handle URL errors from NextAuth (e.g. Google sign-in failure)
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

// List of common disposable/temporary email domains
const disposableEmailDomains = [
  // Common temporary email services
  "tempmail.com", "temp-mail.org", "tempmailo.com", "tempmailaddress.com",
  "10minutemail.com", "10minutemail.net", "10minmail.com", "10minemail.com",
  "guerrillamail.com", "guerrillamail.org", "guerrillamail.net", "guerrillamail.biz", "guerrillamailblock.com",
  "mailinator.com", "mailinator.net", "mailinator.org", "mailinator2.com",
  "throwaway.email", "throwawaymail.com", "throam.com",
  "yopmail.com", "yopmail.fr", "yopmail.net",
  "fakeinbox.com", "fakemailgenerator.com", "fakemail.net",
  "getnada.com", "nada.email",
  "maildrop.cc", "mailnesia.com",
  "trashmail.com", "trashmail.net", "trashmail.org", "trash-mail.com", "trash-mail.at",
  "dispostable.com", "disposableemailaddresses.com", "discard.email", "discardmail.com",
  "sharklasers.com", "spam4.me", "spamgourmet.com", "spamfree24.org", "spamfree.eu",
  "mailcatch.com", "mytrashmail.com",
  "tempinbox.com", "tempr.email", "tmpmail.org", "tmpmail.net", "tmails.net",
  "getairmail.com", "mohmal.com", "emailondeck.com",
  "mintemail.com", "tempail.com", "emailfake.com",
  "crazymailing.com", "tempsky.com",
  "burnermail.io", "mailsac.com", "inboxkitten.com",
  "33mail.com", "anonaddy.com",
  "jetable.org", "mailexpire.com",
  "spamex.com", "spamspot.com",
  "trbvm.com", "armyspy.com", "cuvox.de",
  "dayrep.com", "einrot.com", "fleckens.hu",
  "gustr.com", "jourrapide.com", "rhyta.com",
  "superrito.com", "teleworm.us",
  "mailfreeonline.com", "mail-temporaire.fr",
  "disbox.org", "disbox.net", "dropmail.me",
  "wegwerfemail.de", "sofort-mail.de",
  // CRITICAL: roratu.com and similar domains
  "roratu.com", "tmail.com", "tmail.ws",
  "mailna.co", "mailna.in", "mailna.me",
  "emltmp.com", "tmpbox.net", "moakt.com", "moakt.ws",
  "emlpro.com", "emlhub.com", "fexpost.com", "fexbox.org", "fexbox.ru",
  "bupmail.com", "clrmail.com", "cyclesat.com",
  "firemailbox.club", "gufum.com", "htomail.com",
  "laafd.com", "labworld.org", "laste.ml", "lyft.live",
  "mailbox.in.ua", "mailbox92.biz", "mailboxy.fun",
  "maildax.com", "maileme101.com",
  "mailnax.com", "mailseal.de", "mailtemp.net",
  "mvrht.com", "mvrht.net", "nwytg.com", "nwytg.net",
  "zeroe.ml", "zwoho.com", "zwomail.com",
  "txen.de", "grr.la", "guerrillamail.info",
  "boximail.com", "bobmail.info",
  "tempmail.de", "tempmail.it", "tempmail.ninja",
  "1secmail.com", "1secmail.net", "1secmail.org",
  "wwjmp.com", "ezztt.com", "txcct.com",
  "kzccv.com", "dpptd.com", "rteet.com",
  "oosln.com", "vjuum.com", "lroid.com",
  "email-temp.com", "emailtemporar.ro", "emailtemporario.com.br",
  "cko.kr", "one-time.email", "onetimeusemail.com",
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
  const { data: session, status } = useSession();
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

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
                  className={`w-full bg-[var(--bg-elevated)] border rounded-xl px-4 py-3 text-sm text-white placeholder-[var(--text-tertiary)] focus:outline-none transition-all ${errors.name && touched.name
                      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
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
                  className={`w-full bg-[var(--bg-elevated)] border rounded-xl px-4 py-3 text-sm text-white placeholder-[var(--text-tertiary)] focus:outline-none transition-all ${errors.email && touched.email
                      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                    }`}
                />
                <ErrorMessage
                  name="email"
                  component="p"
                  className="mt-1.5 text-xs text-red-400"
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Use a real email address (no temporary emails)</p>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Field
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    className={`w-full bg-[var(--bg-elevated)] border rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-[var(--text-tertiary)] focus:outline-none transition-all ${errors.password && touched.password
                        ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <ErrorMessage
                  name="password"
                  component="p"
                  className="mt-1.5 text-xs text-red-400"
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
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

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleGoogleSignIn}
            className="py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-white font-medium flex items-center justify-center gap-2 hover:bg-[var(--bg-elevated)] transition-all"
          >
            <Mail className="w-4 h-4" />
            Google
          </button>
          <button
            onClick={() => signIn("github", { callbackUrl: "/" })}
            className="py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-white font-medium flex items-center justify-center gap-2 hover:bg-[var(--bg-elevated)] transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
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
