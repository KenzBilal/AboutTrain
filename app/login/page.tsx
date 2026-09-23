import { Navbar } from "@/components/navigation/Navbar";
import { TrainFront } from "lucide-react";
import { signIn, signUp } from "@/lib/auth/actions";
import { isDemoMode } from "@/lib/env";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{ error?: string; message?: string; tab?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const error = sp.error ?? null;
  const message = sp.message ?? null;
  const isSignUp = sp.tab === 'signup';

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <TrainFront className="h-7 w-7 text-primary" />
              <span className="text-2xl font-bold text-primary tracking-tight">AboutTrain</span>
            </div>
          </div>

          {/* Demo mode notice */}
          {isDemoMode() && (
            <div className="mb-6 border border-border bg-muted/60 rounded-lg px-4 py-3 text-sm text-muted-foreground text-center">
              <p className="font-medium text-foreground mb-1">Demo mode active</p>
              <p>Authentication requires Supabase configuration. Set <code className="text-xs bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-xs bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.local</code> to enable auth.</p>
              <Link href="/" className={buttonVariants({ variant: "link", className: "mt-2 text-primary" })}>Return to home →</Link>
            </div>
          )}

          {!isDemoMode() && (
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              {/* Tabs */}
              <div className="flex border-b border-border">
                <Link
                  href="/login"
                  className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${!isSignUp ? 'text-primary border-b-2 border-primary -mb-px' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Sign In
                </Link>
                <Link
                  href="/login?tab=signup"
                  className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${isSignUp ? 'text-primary border-b-2 border-primary -mb-px' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Create Account
                </Link>
              </div>

              <div className="p-6 space-y-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-3 py-2 border border-destructive/20">
                    {decodeURIComponent(error)}
                  </div>
                )}
                {message && (
                  <div className="bg-emerald-50 text-emerald-800 text-sm rounded-lg px-3 py-2 border border-emerald-200">
                    {decodeURIComponent(message)}
                  </div>
                )}

                <form action={isSignUp ? signUp : signIn} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" htmlFor="password">Password</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      placeholder="••••••••"
                      minLength={8}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className={buttonVariants({ className: "w-full mt-1" })}
                  >
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </button>
                </form>

                <p className="text-xs text-muted-foreground text-center pt-2">
                  {isSignUp
                    ? 'By signing up you agree to use this application responsibly. AboutTrain is a decision-support tool, not a booking portal.'
                    : 'Sign in to save journeys and track predictions.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
