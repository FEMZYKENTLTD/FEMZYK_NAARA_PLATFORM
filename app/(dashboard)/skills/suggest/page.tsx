'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, CheckCircle2, Lightbulb } from 'lucide-react';

export default function SuggestSkillPage() {
  const supabase = createClient();
  const [tradeName, setTradeName] = useState('');
  const [skillName, setSkillName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tradeName.trim() || !skillName.trim()) { setError('Fill in trade and skill name.'); return; }
    setLoading(true); setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not logged in'); setLoading(false); return; }
    const { data: profile } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();
    if (!profile) { setError('Profile not found'); setLoading(false); return; }

    const { error: insertErr } = await supabase.from('skill_suggestions').insert({
      user_id: profile.user_id, trade_name: tradeName.trim(),
      skill_name: skillName.trim(), description: description.trim() || null,
    });

    if (insertErr) { setError('Failed to submit'); console.error(insertErr); }
    else setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card className="p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Suggestion Submitted!</h1>
          <p className="text-slate-600 mb-6">An admin will review your skill suggestion and add it to the system if approved.</p>
          <Link href="/skills"><Button className="bg-purple-600 hover:bg-purple-700 text-white w-full">Back to SkillForge</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link href="/skills" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to SkillForge
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Suggest a New Skill</h1>
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-700 flex items-start gap-2"><Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />Can&apos;t find your skill? Suggest it here. Our admins will review and add it with a proper learning roadmap.</p>
      </Card>
      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Trade / Industry</Label>
            <Input placeholder="e.g. Plumbing, Graphic Design, Farming" value={tradeName} onChange={(e) => setTradeName(e.target.value)} required className="mt-1" /></div>
          <div><Label>Skill Name</Label>
            <Input placeholder="e.g. Pipe Fitting, Logo Design" value={skillName} onChange={(e) => setSkillName(e.target.value)} required className="mt-1" /></div>
          <div><Label>Description (optional)</Label>
            <textarea placeholder="Describe what this skill involves..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 resize-none" /></div>
          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : 'Submit Suggestion'}
          </Button>
        </form>
      </Card>
    </div>
  );
}