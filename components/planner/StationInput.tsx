"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MapPin, Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Station } from "@/types";

interface StationInputProps {
  value: Station | null;
  onChange: (station: Station | null) => void;
  placeholder?: string;
  label: string;
  id: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Station search input with autocomplete.
 * Calls /api/stations/search on each keystroke.
 * Falls back gracefully if the API is unavailable.
 */
export function StationInput({
  value,
  onChange,
  placeholder = "City or station name",
  label,
  id,
  className,
  disabled,
}: StationInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When a station is selected, show its name in input
  const displayValue = value ? `${value.station_name} (${value.station_code})` : query;

  const fetchStations = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/stations/search?q=${encodeURIComponent(q)}&limit=8`);
      if (res.ok) {
        const data: Station[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    onChange(null); // clear selection when user types
    setHighlightedIdx(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchStations(q), 200);
  };

  const handleSelect = (station: Station) => {
    onChange(station);
    setQuery("");
    setResults([]);
    setOpen(false);
    setHighlightedIdx(-1);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIdx >= 0 && results[highlightedIdx]) {
        handleSelect(results[highlightedIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.closest("[data-station-input]")?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={cn("relative", className)} data-station-input>
      <label htmlFor={id} className="block text-sm font-medium text-secondary-foreground mb-1.5">
        {label}
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={value ? `${value.station_name} (${value.station_code})` : query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value) {
              // Let user type to search again
            } else if (query.length > 0 && results.length > 0) {
              setOpen(true);
            }
          }}
          placeholder={placeholder}
          className={cn(
            "w-full h-11 pl-9 pr-9 rounded-lg border border-input bg-background text-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
            "placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors"
          )}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-results`}
          aria-activedescendant={highlightedIdx >= 0 ? `${id}-result-${highlightedIdx}` : undefined}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
          {!loading && value && (
            <button
              type="button"
              onClick={handleClear}
              className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear station"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {!loading && !value && query.length > 0 && (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <ul
          ref={listRef}
          id={`${id}-results`}
          role="listbox"
          className={cn(
            "absolute z-50 top-full mt-1 w-full min-w-[260px] rounded-lg border border-border bg-popover shadow-md",
            "overflow-hidden py-1"
          )}
        >
          {results.map((station, idx) => (
            <li
              key={station.id}
              id={`${id}-result-${idx}`}
              role="option"
              aria-selected={idx === highlightedIdx}
              className={cn(
                "flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors text-sm",
                idx === highlightedIdx
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/60"
              )}
              onMouseDown={(e) => {
                e.preventDefault(); // don't trigger blur
                handleSelect(station);
              }}
              onMouseEnter={() => setHighlightedIdx(idx)}
            >
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="font-medium text-foreground truncate">{station.station_name}</div>
                <div className="text-xs text-muted-foreground">
                  {station.station_code}
                  {station.city && ` · ${station.city}`}
                  {station.state && `, ${station.state}`}
                </div>
              </div>
              <span className="ml-auto text-xs font-mono font-semibold text-primary shrink-0">
                {station.station_code}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
