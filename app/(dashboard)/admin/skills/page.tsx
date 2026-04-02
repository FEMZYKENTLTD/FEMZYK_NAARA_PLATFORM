'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Check, X, Loader2, Lightbulb } from 'lucide-react';

interface SuggestionUser {
  full_name: string;
  username: string;
}

interface SkillSuggestion {
  suggestion_id: string;
  user_id: string;
  trade_name: string;
  skill_name: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: SuggestionUser | null;
}

export default function AdminSkillsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('skill_suggestions')
      .select('*, user:users!skill_suggestions_user_id_fkey(full_name, username)')
      .order('created_at', { ascending: false });
    setSuggestions((data || []) as SkillSuggestion[]);
    setLoading(false);
  }, [supabase]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function handleAction(id: string, action: 'approved' | 'rejected') {
    setProcessing(id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: admin } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();

    await supabase.from('skill_suggestions').update({
      status: action, reviewed_by: admin?.user_id, reviewed_at: new Date().toISOString(),
    }).eq('suggestion_id', id);

    // If approved, create the trade and skill
    if (action === 'approved') {
      const suggestion = suggestions.find((s) => s.suggestion_id === id);
      if (suggestion) {
        // Check if trade exists
        const { data: existingTrade } = await supabase.from('trades').select('trade_id')
          .eq('trade_name', suggestion.trade_name).maybeSingle();

        let tradeId = existingTrade?.trade_id;
        if (!tradeId) {
          const { data: newTrade } = await supabase.from('trades').insert({
            trade_name: suggestion.trade_name, description: `Community-suggested trade: ${suggestion.trade_name}`,
          }).select().single();
          tradeId = newTrade?.trade_id;
        }

        if (tradeId) {
          await supabase.from('skills').insert({
            trade_id: tradeId, skill_name: suggestion.skill_name,
            level: 1, description: suggestion.description || suggestion.skill_name,
          });
        }

        // Notify the user
        await supabase.from('notifications').insert({
          user_id: suggestion.user_id, type: 'skill_approved',
          title: 'Skill Suggestion Approved!',
          message: `Your suggested skill "${suggestion.skill_name}" has been added to the platform.`,
          link: '/skills',
        });
      }
    }

    await load();
    setProcessing(null);
  }

  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Admin
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Skill Suggestions</h1>

      {loading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div> : (
        suggestions.length > 0 ? (
          <div className="space-y-3">
            {suggestions.map((s) => {
              const u = s.user || null;
              return (
                <Card key={s.suggestion_id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        <span className="font-semibold text-slate-900">{s.skill_name}</span>
                        <Badge variant="outline" className="text-xs">{s.trade_name}</Badge>
                        <Badge className={`border-0 text-[10px] ${
                          s.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                          : s.status === 'approved' ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'}`}>{s.status}</Badge>
                      </div>
                      {s.description && <p className="text-sm text-slate-500">{s.description}</p>}
                      <p className="text-xs text-slate-400 mt-1">By {u?.full_name} (@{u?.username}) • {new Date(s.created_at).toLocaleDateString()}</p>
                    </div>

                    {s.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAction(s.suggestion_id, 'approved')}
                          disabled={processing === s.suggestion_id} className="bg-green-600 text-white">
                          {processing === s.suggestion_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" />Approve</>}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleAction(s.suggestion_id, 'rejected')}
                          disabled={processing === s.suggestion_id} className="text-red-600 border-red-200 hover:bg-red-50">
                          <X className="h-4 w-4 mr-1" />Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Lightbulb className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No skill suggestions yet</p>
          </Card>
        )
      )}
    </div>
  );
}