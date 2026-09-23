/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Play, Plus, Trash2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Navbar } from '@/components/navigation/Navbar';
import { triggerCollectionAction } from './actions';

export default function WatchlistAdminPage() {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const supabaseAny = supabase as any;

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: list, error: watchError } = await supabaseAny
        .from('collection_watchlist')
        .select(`
          id, train_id, journey_date, class_code, quota, active, created_at,
          trains(train_number, train_name),
          from_st:stations!collection_watchlist_from_station_fkey(station_code),
          to_st:stations!collection_watchlist_to_station_fkey(station_code)
        `)
        .order('created_at', { ascending: false });
        
      if (watchError) throw watchError;
      setWatchlist(list || []);

      const { data: logList, error: logError } = await supabaseAny
        .from('collection_logs')
        .select(`
          id, status, error_message, captured_at,
          watchlist:collection_watchlist(train_id, trains(train_number))
        `)
        .order('captured_at', { ascending: false })
        .limit(20);

      if (logError) throw logError;
      setLogs(logList || []);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchInit = async () => {
      try {
        const { data: list, error: watchError } = await supabase
          .from('collection_watchlist')
          .select(`
            id, train_id, journey_date, class_code, quota, active, created_at,
            trains(train_number, train_name),
            from_st:stations!collection_watchlist_from_station_fkey(station_code),
            to_st:stations!collection_watchlist_to_station_fkey(station_code)
          `)
          .order('created_at', { ascending: false });
          
        if (watchError) throw watchError;
        if (mounted) setWatchlist(list || []);

        const { data: logList, error: logError } = await supabase
          .from('collection_logs')
          .select(`
            id, status, error_message, captured_at,
            watchlist:collection_watchlist(train_id, trains(train_number))
          `)
          .order('captured_at', { ascending: false })
          .limit(20);

        if (logError) throw logError;
        if (mounted) setLogs(logList || []);
      } catch (err: unknown) {
        if (mounted) setError((err as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchInit();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerCollection = async () => {
    setTriggering(true);
    setError(null);
    try {
      await triggerCollectionAction();
      await fetchData(); // refresh logs
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setTriggering(false);
    }
  };

  const removeRoute = async (id: string) => {
    try {
      const { error: rmError } = await supabaseAny.from('collection_watchlist').delete().eq('id', id);
      if (rmError) throw rmError;
      await fetchData();
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container max-w-5xl mx-auto pt-24 pb-12 px-4 space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data Collection Admin</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage scheduled snapshots and view logs.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Route
            </Button>
            <Button size="sm" onClick={triggerCollection} disabled={triggering}>
              <Play className="w-4 h-4 mr-2" />
              {triggering ? 'Running...' : 'Trigger Collection'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-[2fr_1fr] gap-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" /> Watchlist
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
              ) : watchlist.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Watchlist is empty.</div>
              ) : (
                <ul className="divide-y">
                  {watchlist.map((item) => (
                    <li key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-2">
                          {item.trains?.train_number} 
                          <Badge variant={item.active ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                            {item.active ? 'Active' : 'Expired'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.from_st?.station_code} → {item.to_st?.station_code} • {item.journey_date} • {item.class_code} ({item.quota})
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeRoute(item.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Recent Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
              ) : logs.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No logs available.</div>
              ) : (
                <ul className="divide-y">
                  {logs.map((log) => (
                    <li key={log.id} className="p-4">
                      <div className="flex items-center gap-2">
                        {log.status === 'SUCCESS' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                        <span className="text-sm font-medium">{log.watchlist?.trains?.train_number}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.captured_at), "MMM d, HH:mm")}
                      </div>
                      {log.error_message && (
                        <div className="text-xs text-destructive mt-1.5 bg-destructive/10 p-2 rounded">
                          {log.error_message}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
