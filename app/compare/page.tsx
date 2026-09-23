import { Navbar } from "@/components/navigation/Navbar";
import { ArrowLeft, GitCompare } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ComparePage() {
  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <Navbar />
      
      <main className="flex-1 container px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link href="/planner" className={buttonVariants({ variant: "ghost", size: "sm", className: "text-muted-foreground hover:text-foreground gap-1.5 pl-0 mb-4" })}>
            <ArrowLeft className="h-4 w-4" /> Back to Planner
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Compare Options</h1>
          <p className="text-muted-foreground mt-1">Side-by-side analysis of your selected trains</p>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-xl bg-card">
          <GitCompare className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold mb-2">No trains selected for comparison</h2>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Compare functionality will allow you to select multiple trains from search results and view their confirmation probabilities side-by-side. 
          </p>
          <Link href="/planner" className={buttonVariants()}>
            Plan a journey
          </Link>
        </div>
      </main>
    </div>
  );
}
