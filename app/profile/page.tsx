import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { TrainFront, Bookmark, Settings, LogOut, User, Clock } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { isDemoMode } from "@/lib/env";

export default async function ProfilePage() {
  // Get the current user (null in demo mode or unauthenticated)
  let user = null;
  let savedTrips: Array<{ id: string; from_station: string | null; to_station: string | null; journey_date: string; class_code: string | null }> = [];

  if (!isDemoMode()) {
    const supabase = await createClient();
    if (supabase) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;

      if (user) {
        const { data: trips } = await supabase
          .from('saved_trips')
          .select('id, from_station, to_station, journey_date, class_code')
          .eq('user_id', user.id)
          .order('journey_date', { ascending: true })
          .limit(10);
        savedTrips = trips ?? [];
      }
    }
  }

  const isLoggedIn = !!user;
  const displayName = user?.email?.split('@')[0] ?? null;
  const displayEmail = user?.email ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <Navbar />

      <main className="flex-1 container px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Demo mode notice */}
          {isDemoMode() && (
            <div className="border border-border bg-muted/50 rounded-lg px-4 py-3 text-sm text-muted-foreground">
              <strong className="text-foreground">Demo mode:</strong> Authentication is disabled.
              Configure Supabase to enable user accounts and saved journeys.
            </div>
          )}

          {/* Not logged in (with Supabase configured) */}
          {!isDemoMode() && !isLoggedIn && (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-center gap-4">
                <User className="h-12 w-12 text-muted-foreground opacity-40" />
                <div>
                  <h2 className="text-lg font-semibold">You are not signed in</h2>
                  <p className="text-muted-foreground text-sm mt-1">Sign in to save journeys and track your trips.</p>
                </div>
                <Link href="/login" className={buttonVariants({ className: "mt-2" })}>
                  Sign In or Create Account
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Profile content */}
          {(isLoggedIn || isDemoMode()) && (
            <div className="flex flex-col md:flex-row gap-6">

              {/* Sidebar */}
              <aside className="w-full md:w-60 space-y-3 shrink-0">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col items-center text-center pt-2 pb-1">
                      <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                        <span className="text-xl font-bold text-primary">
                          {isDemoMode() ? 'D' : (displayName?.[0]?.toUpperCase() ?? 'U')}
                        </span>
                      </div>
                      <div className="font-semibold text-sm">
                        {isDemoMode() ? 'Demo User' : (displayName ?? 'User')}
                      </div>
                      {displayEmail && (
                        <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">
                          {displayEmail}
                        </div>
                      )}
                      {isDemoMode() && (
                        <div className="text-xs text-muted-foreground mt-1 italic">Demo account</div>
                      )}
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex items-center gap-2.5 px-2 py-2 rounded-md bg-accent text-sm font-medium text-accent-foreground cursor-default">
                        <TrainFront className="h-4 w-4" /> My Journeys
                      </div>
                      <div className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors cursor-default opacity-50">
                        <Bookmark className="h-4 w-4" /> Saved Routes
                      </div>
                      <div className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors cursor-default opacity-50">
                        <Settings className="h-4 w-4" /> Preferences
                      </div>
                    </div>

                    {isLoggedIn && (
                      <div className="pt-2 border-t">
                        <form action={signOut}>
                          <button
                            type="submit"
                            className="flex items-center gap-2.5 w-full px-2 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <LogOut className="h-4 w-4" /> Sign Out
                          </button>
                        </form>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </aside>

              {/* Main content */}
              <div className="flex-1 min-w-0 space-y-4">
                <h2 className="text-xl font-bold tracking-tight">Saved Journeys</h2>

                {isDemoMode() && (
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Demo journey
                        </div>
                      </div>
                      <h3 className="font-semibold">12926 Paschim Express</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">Phagwara (PGW) → Mumbai Central (BCT)</p>
                      <p className="text-sm font-medium mt-1">18 Oct 2026 · 3A Class</p>
                      <div className="mt-3 flex gap-2">
                        <Link href="/trains/t1?date=2026-10-18&class=3A&quota=GN&from=PGW&to=BCT" className={buttonVariants({ variant: "outline", size: "sm" })}>
                          View Analysis
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!isDemoMode() && savedTrips.length > 0 && savedTrips.map(trip => (
                  <Card key={trip.id}>
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground">
                        {trip.from_station} → {trip.to_station}
                      </p>
                      <p className="text-sm font-medium mt-1">{trip.journey_date} · {trip.class_code}</p>
                    </CardContent>
                  </Card>
                ))}

                {!isDemoMode() && isLoggedIn && savedTrips.length === 0 && (
                  <Card className="border-dashed bg-transparent">
                    <CardContent className="p-12 flex flex-col items-center text-center text-muted-foreground">
                      <Clock className="h-10 w-10 mb-4 opacity-30" />
                      <p className="font-medium">No saved journeys yet.</p>
                      <p className="text-sm mt-1">After analyzing a train, you can save the journey here.</p>
                      <Link href="/planner" className={buttonVariants({ variant: "link", className: "mt-2 text-primary" })}>
                        Plan a journey →
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
