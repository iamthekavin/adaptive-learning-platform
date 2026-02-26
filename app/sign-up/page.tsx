"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth/client";
import { toast } from "sonner";
import {
  GraduationCap,
  ArrowRight,
  Loader2,
} from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        toast.error(result.error.message || "Sign up failed");
      } else {
        toast.success("Account created successfully!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm reveal">
        <div className="premium-card p-10 lg:p-12">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded bg-white text-black">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white text-balance leading-none">
              Register.
            </h1>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-white/30">
              Join the Ecosystem
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                Legal Entity (Full Name)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="minimal-input"
                placeholder="FIRST LAST"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                Identifier (Email)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="minimal-input"
                placeholder="YOU@EXAMPLE.EDU"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                Credentials (Password)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="minimal-input"
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-premium w-full mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Building...
                </>
              ) : (
                <>
                  Initialize Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 text-center">
             <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
              Already Active?{" "}
              <Link
                href="/sign-in"
                className="text-indigo-500 hover:text-indigo-400 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
