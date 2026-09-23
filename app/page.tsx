import { SearchForm } from "@/components/planner/SearchForm";
import { Navbar } from "@/components/navigation/Navbar";
import { TrainFront, TrendingUp, ShieldCheck, Clock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background pt-16 md:pt-24 pb-32">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center space-y-8 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Smarter Railway Decisions
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Plan smarter. Travel with more certainty.
            </h1>
            <p className="text-xl font-medium text-primary">
              Know your estimated confirmation chances before you book.
            </p>
            
            <p className="text-xl text-muted-foreground max-w-2xl">
              Find the trains and booking options that give you the strongest estimated chance of confirmation &mdash; based on current availability and historical patterns.
            </p>

            <div className="w-full max-w-4xl mt-8 bg-card rounded-2xl shadow-xl border border-border/50 p-4 md:p-6">
              <SearchForm />
            </div>
          </div>
        </div>
        
        {/* Abstract Background Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Why choose AboutTrain?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We check real current railway availability to provide data-driven estimates. 
              Historical data collection is ongoing to build these estimates, which are guides rather than guarantees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Data-Driven Estimates</h3>
              <p className="text-muted-foreground">Estimates are based on historical waitlist clearance patterns. Not a guarantee &mdash; a better-informed starting point.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Risk Analysis</h3>
              <p className="text-muted-foreground">Understand the factors affecting your ticket with transparent confidence scores.</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Historical Trends</h3>
              <p className="text-muted-foreground">View past confirmation patterns for your specific train and travel class.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl mx-auto">
            Ready to plan your next journey with confidence?
          </h2>
          <Link href="/planner" className={buttonVariants({ variant: "secondary", size: "lg", className: "text-lg px-8 h-14" })}>
            Start Planning Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <TrainFront className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-primary tracking-tight">AboutTrain</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 AboutTrain. Data-driven Railway Estimates.
          </p>
        </div>
      </footer>
    </main>
  );
}
