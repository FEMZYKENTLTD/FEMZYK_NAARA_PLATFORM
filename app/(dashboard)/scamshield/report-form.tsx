// app/(dashboard)/scamshield/report-form.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, Shield, Camera, X } from 'lucide-react';

const SCAM_TYPES = [
  { value: 'phone', label: 'Phone Scam' },
  { value: 'bank', label: 'Bank Fraud' },
  { value: 'messaging', label: 'Messaging Scam' },
  { value: 'other', label: 'Other' },
];

export default function ScamReportForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [account, setAccount] = useState('');
  const [detail, setDetail] = useState('');
  const [scamType, setScamType] = useState('phone');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter(f => f.size <= 10 * 1024 * 1024 && f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...valid]);
    setPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account.trim() || !detail.trim()) return;
    setLoading(true);
    try {
      // Upload evidence images
      const evidenceUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('scam-evidence').upload(fileName, file);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('scam-evidence').getPublicUrl(fileName);
          evidenceUrls.push(urlData.publicUrl);
        }
      }

      await supabase.from('scam_reports').insert({
        user_id: userId, scam_type: scamType, scam_detail: detail.trim(),
        reported_account: account.trim(), risk_score: 0.5,
        evidence_urls: evidenceUrls,
      });
      setAccount(''); setDetail(''); setFiles([]); setPreviews([]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-slate-900 mb-3">Report a Scam</h2>
      {success && <div className="bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm mb-3">Report submitted with evidence!</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SCAM_TYPES.map((t) => (
            <button type="button" key={t.value} onClick={() => setScamType(t.value)}
              className={`p-2 rounded-lg border text-center text-sm transition-all ${scamType === t.value ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-slate-200'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div><Label htmlFor="account">Phone/Account Number</Label>
          <Input id="account" placeholder="e.g. 08012345678" value={account} onChange={(e) => setAccount(e.target.value)} required className="mt-1" /></div>
        <div><Label htmlFor="detail">What happened?</Label>
          <textarea id="detail" placeholder="Describe the scam..." value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} required
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" /></div>

        {/* Evidence Upload */}
        <div>
          <Label>Evidence (screenshots, photos)</Label>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
          {previews.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {previews.map((p, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFile(i)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="mt-2 flex items-center gap-2 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50">
            <Camera className="h-4 w-4" /> Add Evidence Photos
          </button>
        </div>

        <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : <><Shield className="h-4 w-4 mr-2" />Submit Report</>}
        </Button>
      </form>
    </Card>
  );
}