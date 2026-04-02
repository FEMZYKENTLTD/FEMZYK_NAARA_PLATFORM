'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, AlertTriangle, Loader2 } from 'lucide-react';

interface ScamSearchResult {
  report_id: string;
  reported_account: string;
  scam_type: string;
  risk_score: number;
  scam_detail: string;
}

export default function ScamSearch() {
  const supabase = createClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScamSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setSearched(true);

    const { data } = await supabase.from('scam_reports')
      .select('*')
      .or(`reported_account.ilike.%${query.trim()}%,scam_detail.ilike.%${query.trim()}%`)
      .order('timestamp', { ascending: false }).limit(20);

    setResults((data || []) as ScamSearchResult[]);
    setLoading(false);
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-slate-900 mb-3">Search Reports</h2>
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search phone number, account, or keyword..." value={query}
            onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <button type="submit" disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white px-4 rounded-md text-sm font-medium">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </button>
      </form>

      {searched && (
        <div className="mt-4">
          {results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-500">{results.length} report(s) found</p>
              {results.map((r) => (
                <div key={r.report_id} className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-sm">{r.reported_account}</span>
                    <Badge className="bg-red-100 text-red-700 border-0 text-[10px] capitalize">{r.scam_type}</Badge>
                    <span className="text-red-600 font-bold text-sm ml-auto">{Math.round(r.risk_score * 100)}% risk</span>
                  </div>
                  <p className="text-xs text-slate-600">{r.scam_detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-green-600 font-medium">No reports found for &quot;{query}&quot;</p>
              <p className="text-xs text-slate-400 mt-1">This account/number has no scam reports yet</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}