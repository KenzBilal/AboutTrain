import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Database, Server, Activity, Info } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import { mockStations, mockTrains, mockAvailability, mockHistoricalClearance } from "@/lib/railway/mock-data";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  let stationCount = 0;
  let trainCount = 0;
  let availabilityCount = 0;
  let historicalCount = 0;

  if (isDemoMode()) {
    stationCount = mockStations.length;
    trainCount = mockTrains.length;
    availabilityCount = mockAvailability.length;
    historicalCount = Object.values(mockHistoricalClearance).reduce((acc, val) => acc + val.totalSamples, 0);
  } else {
    const supabase = createAdminClient();
    if (supabase) {
      const [
        { count: sCount },
        { count: tCount },
        { count: aCount },
        { count: hCount }
      ] = await Promise.all([
        supabase.from('stations').select('*', { count: 'exact', head: true }),
        supabase.from('trains').select('*', { count: 'exact', head: true }),
        supabase.from('availability_snapshots').select('*', { count: 'exact', head: true }),
        supabase.from('historical_outcomes').select('*', { count: 'exact', head: true }),
      ]);
      stationCount = sCount ?? 0;
      trainCount = tCount ?? 0;
      availabilityCount = aCount ?? 0;
      historicalCount = hCount ?? 0;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <Navbar />
      
      <main className="flex-1 container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            System overview and data source status.
          </p>
        </div>

        {isDemoMode() && (
          <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 text-amber-800 rounded-lg px-4 py-3 mb-6 text-sm">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <strong className="block mb-1">Demo Mode Active</strong>
              Showing mock data counts. Connect Supabase to view live database metrics.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stations</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stationCount}</div>
              <p className="text-xs text-muted-foreground">Active in database</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trains</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trainCount}</div>
              <p className="text-xs text-muted-foreground">Active in database</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Availability Snapshots</CardTitle>
              <Activity className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{availabilityCount}</div>
              <p className="text-xs text-muted-foreground">Recent queries logged</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Historical Outcomes</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{historicalCount}</div>
              <p className="text-xs text-muted-foreground">Used for heuristic blending</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Engine and authentication layers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="font-medium">Data Provider</span>
                  <span className="text-muted-foreground">{isDemoMode() ? 'MockRailwayDataProvider' : 'SupabaseRailwayDataProvider'}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="font-medium">Prediction Engine</span>
                  <span className="text-muted-foreground">v0.2 (Heuristic + Historical Blending)</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="font-medium">Authentication</span>
                  <span className="text-muted-foreground">{isDemoMode() ? 'Disabled (Demo Mode)' : 'Supabase Auth SSR'}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="font-medium">Row Level Security</span>
                  <span className="text-muted-foreground">{isDemoMode() ? 'N/A' : 'Enforced'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
