import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PredictionGaugeProps {
  probability: number; // 0-100
  confidence: 'High' | 'Medium' | 'Low';
  className?: string;
}

function getProbabilityBand(prob: number): { label: string; color: string; barColor: string; textColor: string } {
  if (prob >= 80) return { label: 'High estimated probability', color: 'bg-emerald-50 border-emerald-200', barColor: 'bg-emerald-500', textColor: 'text-emerald-700' };
  if (prob >= 60) return { label: 'Moderate-high estimated probability', color: 'bg-teal-50 border-teal-200', barColor: 'bg-teal-500', textColor: 'text-teal-700' };
  if (prob >= 40) return { label: 'Moderate estimated probability', color: 'bg-amber-50 border-amber-200', barColor: 'bg-amber-500', textColor: 'text-amber-700' };
  if (prob >= 20) return { label: 'Low estimated probability', color: 'bg-orange-50 border-orange-200', barColor: 'bg-orange-400', textColor: 'text-orange-700' };
  return { label: 'Very low estimated probability', color: 'bg-rose-50 border-rose-200', barColor: 'bg-rose-500', textColor: 'text-rose-700' };
}

const confidenceLabel: Record<string, string> = {
  High: 'High confidence',
  Medium: 'Medium confidence',
  Low: 'Low confidence — limited historical data',
};

export function PredictionGauge({ probability, confidence, className }: PredictionGaugeProps) {
  const band = getProbabilityBand(probability);

  return (
    <div className={cn("space-y-3", className)}>
      <div className={cn("rounded-lg border px-3 py-2.5", band.color)}>
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground">Est. confirmation probability</span>
          <span className={cn("text-2xl font-bold tabular-nums", band.textColor)}>{probability}%</span>
        </div>
        <Progress
          value={probability}
          className="h-2 bg-border/60"
          indicatorClassName={band.barColor}
        />
        <p className={cn("text-xs mt-1.5 font-medium", band.textColor)}>{band.label}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-border"></span>
          {confidenceLabel[confidence] ?? confidence}
        </span>
        <span className="italic">Not a guarantee</span>
      </div>
    </div>
  );
}
