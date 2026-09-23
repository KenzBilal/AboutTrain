import { Navbar } from "@/components/navigation/Navbar";
import { TrainCard } from "@/components/trains/TrainCard";
import { PredictionExplainer } from "@/components/prediction/PredictionExplainer";
import { getDataProvider, getAvailabilityProvider } from "@/lib/railway/provider";
import { mockTrains, mockAvailability } from "@/lib/railway/mock-data";
import { calculatePrediction } from "@/lib/prediction/engine";
import { differenceInDays, parseISO, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, TrendingUp, Train as TrainIcon, ArrowLeft, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { TrainResult } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TrainDetailsPage({ params, searchParams }: PageProps) {
  const { id: trainId } = await params;
  const sp = await searchParams;

  const dateStr = typeof sp.date === 'string' ? sp.date : '';
  const classCode = typeof sp.class === 'string' ? sp.class : '';
  const quota = typeof sp.quota === 'string' ? sp.quota : '';
  const fromCode = typeof sp.from === 'string' ? sp.from : '';
  const toCode = typeof sp.to === 'string' ? sp.to : '';

  if (!dateStr || !classCode || !quota || !fromCode || !toCode) {
    return (
      <div className="flex min-h-screen flex-col bg-secondary/30">
        <Navbar />
        <main className="flex-1 container px-4 py-16 max-w-4xl flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold text-lg mb-1">Missing journey details</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            Full analysis requires complete search context including journey date, class, and quota.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/planner" className={buttonVariants()}>Plan Journey</Link>
            <Link href="/trains" className={buttonVariants({ variant: "outline" })}>Search Results</Link>
          </div>
        </main>
      </div>
    );
  }

  const provider = getDataProvider();
  const availProvider = getAvailabilityProvider();

  // Load stations
  const [fromStation, toStation] = await Promise.all([
    fromCode ? provider.getStation(fromCode) : null,
    toCode ? provider.getStation(toCode) : null,
  ]);

  const journeyDate = dateStr;
  const daysToJourney = Math.max(0, differenceInDays(parseISO(journeyDate), new Date()));

  // 1. Find train using provider
  let searchResults: TrainResult[] = [];
  if (fromCode && toCode) {
    try {
      searchResults = await provider.searchTrains({
        fromCode,
        toCode,
        date: journeyDate,
        classCode,
        quota
      });
    } catch (e) {
      console.error('Failed to search trains on detail page', e);
    }
  }

  let result = searchResults.find(r => r.train.id === trainId);

  // Fallback if not found via search (e.g., direct link without proper from/to or provider down)
  if (!result) {
    const mockTrain = mockTrains.find(t => t.id === trainId) ?? mockTrains[0];
    const resolvedFrom = fromStation ?? { id: 'PGW', station_code: fromCode || 'PGW', station_name: fromCode || 'Unknown', city: '', state: '', zone: '' };
    const resolvedTo = toStation ?? { id: 'BCT', station_code: toCode || 'BCT', station_name: toCode || 'Unknown', city: '', state: '', zone: '' };
    
    result = {
      train: mockTrain,
      fromStation: resolvedFrom,
      toStation: resolvedTo,
      departureTime: "09:12",
      arrivalTime: "14:35 +1",
      duration: "29h 23m",
    };
  }

  // 2. Find availability
  let avail = null;
  if (availProvider) {
    try {
      avail = await availProvider.getAvailability({
        trainId: result.train.train_number, // provider needs train number/id
        fromStation: result.fromStation.station_code,
        toStation: result.toStation.station_code,
        journeyDate,
        classCode,
        quota
      });
    } catch (e) {
      console.error('Failed to fetch availability', e);
    }
  }

  // Fallback to mock availability only in demo mode
  if (!avail && provider.isDemo) {
    avail = mockAvailability.find(a => a.train_id === result!.train.id && a.class_code === classCode) ?? mockAvailability[0];
  }

  let historical = null;
  let prediction = null;

  if (avail) {
    result.availability = { ...avail, journey_date: journeyDate, class_code: classCode, quota };

    // 3. Get historical clearance
    historical = await provider.getHistoricalClearance(result.train.id, classCode, quota);

    prediction = calculatePrediction({
      trainId: result.train.id,
      journeyDate,
      classCode,
      quota,
      status: result.availability.status,
      waitlistNumber: result.availability.waitlist_number,
      racNumber: result.availability.rac_number,
      daysToJourney,
      historicalClearanceRate: historical?.clearanceRate,
      historicalSampleCount: historical?.totalSamples,
    });

    result.prediction = prediction;
  } else {
    // Availability is completely unavailable
    result.availability = undefined;
    result.prediction = undefined;
  }

  const { train, fromStation: resolvedFrom, toStation: resolvedTo } = result;

  // Alternatives: keep simple fallback for UI purposes
  const alternatives = mockAvailability
    .filter(a => a.train_id !== result!.train.id && a.from_station === resolvedFrom.station_code)
    .map(a => {
      const altTrain = mockTrains.find(t => t.id === a.train_id)!;
      const altPred = calculatePrediction({
        trainId: a.train_id,
        journeyDate,
        classCode: a.class_code,
        quota: a.quota,
        status: a.status,
        waitlistNumber: a.waitlist_number,
        racNumber: a.rac_number,
        daysToJourney,
      });
      return { train: altTrain, avail: a, prediction: altPred };
    });

  const formattedDate = dateStr ? format(parseISO(dateStr), "EEE, dd MMM yyyy") : null;
  const backHref = fromCode && toCode
    ? `/trains?from=${fromCode}&to=${toCode}${dateStr ? `&date=${dateStr}` : ''}&class=${classCode}&quota=${quota}`
    : '/trains';

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <Navbar />

      <main className="flex-1 container px-4 py-6 max-w-4xl">
        <div className="mb-5">
          <Link href={backHref} className={buttonVariants({ variant: "ghost", size: "sm", className: "text-muted-foreground hover:text-foreground gap-1.5 pl-0" })}>
            <ArrowLeft className="h-4 w-4" /> Back to Results
          </Link>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground border border-border rounded-lg px-4 py-2.5 mb-5">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            <strong>Note:</strong> Availability data may be sourced from third-party railway providers and predictions are estimates, not guarantees. Verify on{" "}
            <a href="https://www.irctc.co.in" target="_blank" rel="noopener noreferrer" className="underline font-medium">
              IRCTC <ExternalLink className="h-2.5 w-2.5 inline" />
            </a>{" "}
            before travel.
          </span>
        </div>

        {/* Train Card */}
        <div className="mb-6">
          <TrainCard result={result} />
        </div>

        {/* Analysis Tabs */}
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="border-b w-full rounded-none h-auto p-0 bg-transparent justify-start gap-0 mb-0">
            <TabsTrigger value="analysis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm">
              <TrendingUp className="w-4 h-4 mr-1.5" /> Analysis
            </TabsTrigger>
            <TabsTrigger value="alternatives" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm">
              <TrainIcon className="w-4 h-4 mr-1.5" /> Alternatives
            </TabsTrigger>
            <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-sm">
              <Info className="w-4 h-4 mr-1.5" /> Train Info
            </TabsTrigger>
          </TabsList>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="mt-5 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Why AboutTrain estimates {prediction?.predicted_probability ?? '--'}%
                </CardTitle>
                <CardDescription className="space-y-1">
                  <span>Confidence: <strong>{prediction?.confidence ?? 'N/A'}</strong></span>
                  {formattedDate && <span className="ml-3">Journey: {formattedDate}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {prediction ? <PredictionExplainer factors={prediction.factors} /> : <p className="text-sm text-muted-foreground">Live data unavailable, cannot predict.</p>}

                {/* Historical data card */}
                {historical && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-2 text-secondary-foreground">Historical Clearance Data</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="text-xl font-bold text-foreground">{historical.totalSamples}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Samples</div>
                      </div>
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="text-xl font-bold text-emerald-700">{Math.round(historical.clearanceRate * 100)}%</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Clearance rate</div>
                      </div>
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="text-xl font-bold text-foreground">
                          {historical.avgClearedWl !== null ? `WL ${historical.avgClearedWl}` : '—'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">Avg cleared WL</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 italic">Source: {historical.dataSource}</p>
                  </div>
                )}

                <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
                  <p><strong>About this estimate:</strong> Probability is computed by a deterministic heuristic using WL/RAC position, days to journey, class, quota, and where available, historical clearance rates. This is not a trained ML model. Results improve as historical data grows.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alternatives Tab */}
          <TabsContent value="alternatives" className="mt-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Alternative trains on this route</CardTitle>
                <CardDescription>
                  Compare options. Better confirmation probability does not guarantee a seat.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alternatives.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No alternative trains found in current dataset.</p>
                ) : alternatives.map(({ train: altTrain, avail: altAvail, prediction: altPred }) => {
                  const statusLabel =
                    altAvail.status === 'CNF' || altAvail.status === 'AVAILABLE' ? 'Confirmed'
                    : altAvail.status === 'RAC' ? `RAC ${altAvail.rac_number}`
                    : altAvail.status === 'WL' ? `WL ${altAvail.waitlist_number}`
                    : altAvail.status;

                  const probColor = !altPred ? 'text-muted-foreground' : altPred.predicted_probability >= 70 ? 'text-emerald-700'
                    : altPred.predicted_probability >= 40 ? 'text-amber-700'
                    : 'text-rose-700';

                  return (
                    <Link
                      key={altAvail.id}
                      href={`/trains/${altTrain.id}?date=${journeyDate}&class=${altAvail.class_code}&quota=${altAvail.quota}&from=${resolvedFrom.station_code}&to=${resolvedTo.station_code}`}
                      className="flex items-center justify-between p-3.5 border rounded-lg bg-background hover:bg-accent/50 transition-colors group"
                    >
                      <div>
                        <div className="font-medium text-sm group-hover:text-primary transition-colors">
                          {altTrain.train_number} {altTrain.train_name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {altAvail.class_code} · ₹{altAvail.fare.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-medium">{statusLabel}</div>
                        <div className={`text-xs mt-0.5 font-semibold ${probColor}`}>
                          {altPred ? `~${altPred.predicted_probability}% est.` : 'No prediction'}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info" className="mt-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{train.train_number} — {train.train_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{train.train_type}</span>
                  <span className="text-muted-foreground">Runs on</span>
                  <span className="font-medium">{train.runs_on}</span>
                  <span className="text-muted-foreground">Origin</span>
                  <span className="font-medium">{train.source_station}</span>
                  <span className="text-muted-foreground">Destination</span>
                  <span className="font-medium">{train.destination_station}</span>
                </div>
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Schedule and route details are illustrative in this demo.
                  Verify on <a href="https://www.irctc.co.in" target="_blank" rel="noopener noreferrer" className="underline text-primary">IRCTC</a> or NTES before travel.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
