"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ArrowRightLeft, Users } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StationInput } from "@/components/planner/StationInput";
import { cn } from "@/lib/utils";
import type { Station } from "@/types";

const CLASS_OPTIONS = [
  { value: "SL",  label: "SL — Sleeper" },
  { value: "3A",  label: "3A — Third AC" },
  { value: "2A",  label: "2A — Second AC" },
  { value: "1A",  label: "1A — First AC" },
  { value: "CC",  label: "CC — Chair Car" },
  { value: "2S",  label: "2S — Second Sitting" },
];

const QUOTA_OPTIONS = [
  { value: "GN",  label: "General (GN)" },
  { value: "TQ",  label: "Tatkal (TQ)" },
  { value: "PT",  label: "Premium Tatkal (PT)" },
  { value: "LD",  label: "Ladies (LD)" },
];

export function SearchForm() {
  const router = useRouter();
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [classCode, setClassCode] = useState("3A");
  const [quota, setQuota] = useState("GN");
  const [passengers, setPassengers] = useState("1");
  const [dateOpen, setDateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSwap = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fromStation || !toStation) {
      setError("Please select both origin and destination stations.");
      return;
    }
    if (!date) {
      setError("Please select a journey date.");
      return;
    }
    if (fromStation.station_code === toStation.station_code) {
      setError("Origin and destination cannot be the same station.");
      return;
    }

    const params = new URLSearchParams({
      from: fromStation.station_code,
      to: toStation.station_code,
      date: format(date, "yyyy-MM-dd"),
      class: classCode,
      quota,
      passengers,
    });
    router.push(`/trains?${params.toString()}`);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <form onSubmit={handleSearch} className="space-y-4 w-full">
      {/* Row 1: From / Swap / To */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <StationInput
          id="from-station"
          label="From"
          placeholder="City or station (e.g. Phagwara)"
          value={fromStation}
          onChange={setFromStation}
        />

        <div className="flex justify-center pb-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSwap}
            className="rounded-full h-9 w-9 border border-border hover:border-primary hover:text-primary transition-colors"
            title="Swap stations"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>

        <StationInput
          id="to-station"
          label="To"
          placeholder="City or station (e.g. Mumbai)"
          value={toStation}
          onChange={setToStation}
        />
      </div>

      {/* Row 2: Date / Class / Quota / Passengers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Journey Date */}
        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <label className="block text-sm font-medium text-secondary-foreground">Date</label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full h-11 justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {date ? format(date, "dd MMM yyyy") : <span>Pick a date</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(day) => {
                  if (day) { setDate(day); setDateOpen(false); }
                }}
                disabled={(d: Date) => d < today}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Class */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-secondary-foreground">Class</label>
          <Select value={classCode} onValueChange={(v) => v && setClassCode(v)}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLASS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quota */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-secondary-foreground">Quota</label>
          <Select value={quota} onValueChange={(v) => v && setQuota(v)}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUOTA_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Passengers */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-secondary-foreground">Passengers</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Select value={passengers} onValueChange={(v) => v && setPassengers(v)}>
              <SelectTrigger className="h-11 w-full pl-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'passenger' : 'passengers'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Validation error */}
      {error && (
        <p className="text-sm text-destructive font-medium">{error}</p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full sm:w-auto px-10 h-11 bg-primary hover:bg-primary/90 font-semibold"
      >
        Analyze Journey
      </Button>
    </form>
  );
}
