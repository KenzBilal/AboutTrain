import { TrainResult } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Clock, IndianRupee, Train as TrainIcon, ChevronRight } from "lucide-react";
import { PredictionGauge } from "@/components/prediction/PredictionGauge";
import Link from "next/link";
import { calculatePrediction } from "@/lib/prediction/engine";
import { differenceInDays, parseISO } from "date-fns";

interface TrainCardProps {
  result: TrainResult;
}

export function TrainCard({ result }: TrainCardProps) {
  const { train, fromStation, toStation, departureTime, arrivalTime, duration, availability } = result;

  // Calculate prediction on the fly if not provided
  let prediction = result.prediction;
  if (!prediction && availability) {
    const daysToJourney = differenceInDays(parseISO(availability.journey_date), new Date());
    prediction = calculatePrediction({
      trainId: train.id,
      journeyDate: availability.journey_date,
      classCode: availability.class_code,
      quota: availability.quota,
      status: availability.status,
      waitlistNumber: availability.waitlist_number,
      racNumber: availability.rac_number,
      daysToJourney: Math.max(0, daysToJourney)
    });
  }

  const isConfirmed = availability?.status === 'CNF' || availability?.status === 'AVAILABLE';

  const getStatusBadge = () => {
    if (!availability) return <Badge variant="secondary">Live availability unavailable</Badge>;
    switch (availability.status) {
      case 'CNF':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">Confirmed</Badge>;
      case 'AVAILABLE':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
          Available {availability.available_count ? `(${availability.available_count})` : ''}
        </Badge>;
      case 'RAC':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">RAC {availability.rac_number}</Badge>;
      case 'WL':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100">WL {availability.waitlist_number}</Badge>;
      case 'REGRET':
        return <Badge variant="secondary">Not Available</Badge>;
      default:
        return <Badge variant="secondary">{availability.status}</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-sm transition-shadow overflow-hidden border-border">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Left: Train & Journey Info */}
          <div className="p-5 space-y-4">
            {/* Train header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono text-muted-foreground">{train.train_number}</span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-auto">{train.train_type}</Badge>
                </div>
                <h3 className="text-base font-semibold text-foreground">{train.train_name}</h3>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <TrainIcon className="h-3 w-3" />
                  Runs {train.runs_on}
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="flex items-center justify-end text-sm font-semibold text-foreground">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {availability ? availability.fare.toLocaleString('en-IN') : '—'}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {availability ? `${availability.class_code} · ${availability.quota} quota` : 'Live prices unavailable'}
                </div>
                {availability && (
                  <div className="text-[9px] text-muted-foreground/70 mt-1 uppercase tracking-wider">
                    {availability.source}
                  </div>
                )}
              </div>
            </div>

            {/* Journey timeline */}
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <div>
                <div className="text-2xl font-bold text-foreground tabular-nums">{departureTime}</div>
                <div className="text-sm font-medium text-foreground">{fromStation.station_code}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[100px]">{fromStation.city}</div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />{duration}
                </div>
                <div className="flex items-center w-full">
                  <div className="h-px bg-border flex-1"></div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mx-1" />
                  <div className="h-px bg-border flex-1"></div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-foreground tabular-nums">{arrivalTime}</div>
                <div className="text-sm font-medium text-foreground">{toStation.station_code}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[100px] text-right">{toStation.city}</div>
              </div>
            </div>
          </div>

          {/* Right: Status & Prediction */}
          <div className="p-5 flex flex-col justify-between bg-secondary/30">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Status</span>
                {getStatusBadge()}
              </div>

              {isConfirmed ? (
                <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  Seat availability confirmed. Book promptly on IRCTC to secure your ticket.
                </div>
              ) : prediction ? (
                <PredictionGauge
                  probability={prediction.predicted_probability}
                  confidence={prediction.confidence}
                />
              ) : (
                <div className="text-sm text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                  No prediction available. Live data needed.
                </div>
              )}
            </div>

            <div className="pt-4 mt-auto">
              <Link
                href={`/trains/${train.id}?from=${fromStation.station_code}&to=${toStation.station_code}${availability ? `&date=${availability.journey_date}&class=${availability.class_code}&quota=${availability.quota}` : ''}`}
                className={buttonVariants({ className: "w-full text-center" })}
              >
                Full Analysis
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
