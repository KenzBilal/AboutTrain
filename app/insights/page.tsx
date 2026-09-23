import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, BarChart2, CalendarDays, Info, Database } from "lucide-react";
import { getDataProvider } from "@/lib/railway/provider";
import { isDemoMode } from "@/lib/env";
import { mockTrains } from "@/lib/railway/mock-data";

export default async function InsightsPage() {
  const provider = getDataProvider();

  // Compute clearance stats from available data
  const clearanceStats = await Promise.all(
    mockTrains.flatMap(train =>
      [['3A', 'GN'], ['SL', 'GN'], ['2A', 'GN']].map(async ([cls, quota]) => {
        const hist = await provider.getHistoricalClearance(train.id, cls, quota);
        return hist ? { train, classCode: cls, quota, hist } : null;
      })
    )
  ).then(results => results.filter(Boolean) as NonNullable<typeof results[number]>[]);

  const hasData = clearanceStats.length > 0;

  // Best class by clearance rate
  const byClass = clearanceStats.reduce((acc, s) => {
    const key = s.classCode;
    if (!acc[key]) acc[key] = { totalCleared: 0, totalSamples: 0 };
    acc[key].totalCleared += s.hist.clearedSamples;
    acc[key].totalSamples += s.hist.totalSamples;
    return acc;
  }, {} as Record<string, { totalCleared: number; totalSamples: number }>);

  const bestClass = Object.entries(byClass)
    .map(([cls, stats]) => ({ cls, rate: stats.totalCleared / stats.totalSamples, samples: stats.totalSamples }))
    .sort((a, b) => b.rate - a.rate)[0] ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <Navbar />

      <main className="flex-1 container px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Travel Insights</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Historical patterns from the current dataset. Based on {provider.providerName}.
          </p>
        </div>

        {/* Data source notice */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground border border-border rounded-lg px-4 py-3 mb-6 bg-muted/40">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
          <span>
            {isDemoMode()
              ? <><strong className="text-foreground">Demo data:</strong> All figures shown are from a small illustrative dataset with {clearanceStats.reduce((s, c) => s + c.hist.totalSamples, 0)} historical samples. These numbers are not representative of actual Indian Railways confirmation rates.</>
              : <><strong className="text-foreground">Live data:</strong> Figures computed from historical_outcomes table. Estimates improve as more data is ingested.</>
            }
          </span>
        </div>

        {hasData ? (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5" /> Total Samples
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {clearanceStats.reduce((s, c) => s + c.hist.totalSamples, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Historical ticket records</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <BarChart2 className="h-3.5 w-3.5" /> Best Class (by clearance)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bestClass ? (
                    <>
                      <div className="text-2xl font-bold text-emerald-700">{bestClass.cls}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round(bestClass.rate * 100)}% clearance rate · {bestClass.samples} samples
                      </p>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Insufficient data</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" /> Booking advice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">45+ days</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    General heuristic — earlier booking gives more time for WL to clear.
                    <span className="italic"> Not validated by current dataset.</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Clearance table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Clearance Rate by Train &amp; Class</CardTitle>
                <CardDescription>
                  Historical outcomes from current dataset. Lower sample counts mean less reliable estimates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Train</th>
                        <th className="pb-2 pr-4 font-medium">Class</th>
                        <th className="pb-2 pr-4 font-medium">Samples</th>
                        <th className="pb-2 pr-4 font-medium">Cleared</th>
                        <th className="pb-2 font-medium">Clearance rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {clearanceStats.map((s, idx) => {
                        const rate = s.hist.clearanceRate;
                        const color = rate >= 0.7 ? 'text-emerald-700' : rate >= 0.4 ? 'text-amber-700' : 'text-rose-700';
                        return (
                          <tr key={idx} className="py-2">
                            <td className="py-2.5 pr-4">
                              <span className="font-medium">{s.train.train_number}</span>
                              <span className="text-muted-foreground text-xs ml-1.5">{s.train.train_name}</span>
                            </td>
                            <td className="py-2.5 pr-4 font-mono text-xs font-semibold">{s.classCode}</td>
                            <td className="py-2.5 pr-4 text-muted-foreground">{s.hist.totalSamples}</td>
                            <td className="py-2.5 pr-4 text-muted-foreground">{s.hist.clearedSamples}</td>
                            <td className="py-2.5">
                              <span className={`font-semibold ${color}`}>{Math.round(rate * 100)}%</span>
                              {s.hist.totalSamples < 20 && (
                                <span className="text-xs text-muted-foreground ml-2 italic">(low confidence)</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-4 italic border-t pt-3">
                  Source: {clearanceStats[0]?.hist.dataSource ?? provider.providerName}
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Honest empty state */
          <Card>
            <CardContent className="flex flex-col items-center py-20 text-center gap-3">
              <TrendingUp className="h-12 w-12 text-muted-foreground/30" />
              <h3 className="font-semibold text-lg">No historical data yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Insights will appear here as historical ticket clearance data is collected.
                Fabricating statistics would be misleading — this page will remain empty until real data is available.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
