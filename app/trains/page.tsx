import { Navbar } from "@/components/navigation/Navbar";
import { TrainCard } from "@/components/trains/TrainCard";
import { buttonVariants } from "@/components/ui/button";
import { parseISO, format } from "date-fns";
import Link from "next/link";
import { AlertCircle, Clock, Info } from "lucide-react";
import { getDataProvider, getAvailabilityProvider } from "@/lib/railway/provider";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = 'force-dynamic'; // always fresh — availability data changes

export default async function SearchResultsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const fromCode = typeof sp.from === 'string' ? sp.from.toUpperCase() : '';
  const toCode = typeof sp.to === 'string' ? sp.to.toUpperCase() : '';
  const dateStr = typeof sp.date === 'string' ? sp.date : '';
  const classCode = typeof sp.class === 'string' ? sp.class : '';
  const quota = typeof sp.quota === 'string' ? sp.quota : 'GN';

  const provider = getDataProvider();

  // Validate inputs
  const missingInputs = !fromCode || !toCode;

  let results: Awaited<ReturnType<typeof provider.searchTrains>> = [];
  let fromStation = null;
  let toStation = null;
  let searchError: string | null = null;

  if (!missingInputs) {
    try {
      [fromStation, toStation] = await Promise.all([
        provider.getStation(fromCode),
        provider.getStation(toCode),
      ]);

      results = await provider.searchTrains({
        fromCode,
        toCode,
        date: dateStr,
        classCode: classCode || undefined,
        quota,
      });

      const availProvider = getAvailabilityProvider();
      if (availProvider && dateStr && classCode) {
        // Fetch live availability for all trains concurrently
        await Promise.all(results.map(async (result) => {
          try {
            const avail = await availProvider.getAvailability({
              trainId: result.train.id,
              fromStation: fromCode,
              toStation: toCode,
              journeyDate: dateStr,
              classCode,
              quota,
            });
            if (avail) {
              result.availability = avail;
            }
          } catch (e) {
            console.error(`Failed to fetch availability for ${result.train.id}`, e);
          }
        }));
      }
    } catch (err) {
      console.error('[trains/search] Error:', err);
      searchError = 'Search failed. Please try again.';
    }
  }

  const formattedDate = dateStr
    ? format(parseISO(dateStr), "EEE, dd MMM yyyy")
    : 'Date not set';

  const unknownFrom = fromCode && !fromStation;
  const unknownTo = toCode && !toStation;
  const usingFallback = provider.isDemo && (unknownFrom || unknownTo);

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <Navbar />

      {/* Journey Header */}
      <div className="bg-primary text-primary-foreground py-5">
        <div className="container px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2 flex-wrap">
                {(fromStation?.station_name ?? fromCode) || '?'}
                {fromStation && <span className="text-primary-foreground/60 font-normal text-base">({fromStation.station_code})</span>}
                <span className="text-primary-foreground/50">→</span>
                {(toStation?.station_name ?? toCode) || '?'}
                {toStation && <span className="text-primary-foreground/60 font-normal text-base">({toStation.station_code})</span>}
              </h1>
              <p className="text-primary-foreground/75 text-sm mt-1 flex items-center gap-3 flex-wrap">
                <span>{formattedDate}</span>
                {classCode && <span>· {classCode}</span>}
                {quota !== 'GN' && <span>· {quota} quota</span>}
                {!missingInputs && !searchError && (
                  <span>· {results.length} train{results.length !== 1 ? 's' : ''} found</span>
                )}
              </p>
            </div>
            <Link href="/planner" className={buttonVariants({ variant: "secondary", size: "sm", className: "shrink-0" })}>
              Modify Search
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 container px-4 py-6 max-w-4xl">
        {/* Demo mode notice */}
        {provider.isDemo && (
          <div className="flex items-start gap-3 border border-border bg-muted/50 text-sm text-muted-foreground rounded-lg px-4 py-3 mb-4">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>
              <strong className="text-foreground">Demo mode</strong> — showing illustrative data. No Supabase connection configured.
              Predictions are heuristic estimates, not validated by historical data.
              {' '}<Link href="/admin" className="underline text-primary">View setup status →</Link>
            </span>
          </div>
        )}

        {/* Fallback route notice */}
        {usingFallback && (
          <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 text-amber-800 rounded-lg px-4 py-3 mb-4 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Station{unknownFrom && unknownTo ? 's' : ''}
              {unknownFrom && <> &ldquo;{fromCode}&rdquo;</>}
              {unknownFrom && unknownTo && ' and'}
              {unknownTo && <> &ldquo;{toCode}&rdquo;</>}
              {' '}not found in the demo dataset. Showing sample trains for a representative route.
            </span>
          </div>
        )}

        {/* Data disclaimer */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground border border-border rounded-lg px-4 py-2.5 mb-5">
          <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            Availability and confirmation estimates are {getAvailabilityProvider()?.isDemo ? <strong>illustrative demo data</strong> : <>sourced from <strong>{getAvailabilityProvider()?.providerName || 'Live IRCTC/NTES providers'}</strong></>}.
            Estimates are not guarantees. Always verify on{' '}
            <a href="https://www.irctc.co.in" target="_blank" rel="noopener noreferrer" className="underline text-primary">
              IRCTC
            </a>{' '}
            before booking.
          </span>
        </div>

        {/* Error state */}
        {searchError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="font-semibold text-lg mb-1">Search error</h3>
            <p className="text-muted-foreground text-sm">{searchError}</p>
          </div>
        )}

        {/* Missing input state */}
        {missingInputs && !searchError && (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg mb-1">Missing search criteria</h3>
            <p className="text-muted-foreground text-sm">Enter origin and destination to find trains.</p>
            <Link href="/planner" className={buttonVariants({ className: "mt-4" })}>Go to Planner</Link>
          </div>
        )}

        {/* Empty results */}
        {!missingInputs && !searchError && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl">
            <Info className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg mb-1">No trains found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              No trains found for {fromCode} → {toCode}
              {classCode && ` in ${classCode}`}
              {dateStr && ` on ${formattedDate}`}.
              Try a different class or date.
            </p>
            <Link href="/planner" className={buttonVariants({ variant: "outline", className: "mt-4" })}>
              Modify Search
            </Link>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result) => (
              <TrainCard key={result.availability?.id ?? result.train.id} result={result} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
