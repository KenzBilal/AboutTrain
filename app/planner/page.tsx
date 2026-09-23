import { SearchForm } from "@/components/planner/SearchForm";
import { Navbar } from "@/components/navigation/Navbar";

export default function PlannerPage() {
  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <Navbar />
      <main className="flex-1 container px-4 py-12 md:py-24">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Plan Your Journey</h1>
            <p className="text-muted-foreground">Enter your travel details to find trains, check real-time availability, and get waitlist estimates.</p>
          </div>
          
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 md:p-8">
            <SearchForm />
          </div>
        </div>
      </main>
    </div>
  );
}
