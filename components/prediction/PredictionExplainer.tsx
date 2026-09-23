import { PredictionFactor } from "@/types";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface PredictionExplainerProps {
  factors: PredictionFactor[];
  className?: string;
}

export function PredictionExplainer({ factors, className }: PredictionExplainerProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="text-sm font-semibold text-secondary-foreground">Why this prediction?</h4>
      <ul className="space-y-2">
        {factors.map((factor, idx) => (
          <li key={idx} className="flex gap-3 text-sm">
            <div className="shrink-0 mt-0.5">
              {factor.impact === 'Positive' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              {factor.impact === 'Negative' && <AlertCircle className="h-4 w-4 text-rose-500" />}
              {factor.impact === 'Neutral' && <Info className="h-4 w-4 text-amber-500" />}
            </div>
            <div>
              <p className="font-medium text-foreground">{factor.label}</p>
              <p className="text-muted-foreground">{factor.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
