'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Plus, Loader2, UserPlus, X, Target, Shield, Users } from 'lucide-react';
import Link from 'next/link';

interface BillListItem {
  bill_id: string;
  title: string;
  amount: number;
  status: string;
  mode?: string;
  is_demo?: boolean;
  is_contribution?: boolean;
  splits?: Record<string, unknown> | { names?: Record<string, string> };
}

interface SearchUser {
  user_id: string;
  full_name: string;
  username: string;
}

export default function BillSplitPage() {
  const supabase = useMemo(() => createClient(), []);
  const [bills, setBills] = useState<BillListItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [collectionMode, setCollectionMode] = useState<'escrow' | 'self'>('self');
  const [isContribution, setIsContribution] = useState(false);
  const [targetAmount, setTargetAmount] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [members, setMembers] = useState<{ user_id: string; full_name: string; username: string; custom_amount: string }[]>([]);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from('users').select('user_id, full_name, username').eq('auth_id', user.id).single();
        if (p) { setUserId(p.user_id); setUserName(p.full_name); }
      }
      const { data } = await supabase.from('bills').select('*').order('created_at', { ascending: false });
      if (data) setBills(data as BillListItem[]);
    }
    load();
  }, [supabase, success]);

  async function searchUsers(q: string) {
    setMemberSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase.from('users').select('user_id, full_name, username')
      .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`).limit(5);
    setSearchResults(((data || []) as SearchUser[]).filter((u) => !members.some((m) => m.user_id === u.user_id)));
  }

  function addMember(u: SearchUser) {
    setMembers(prev => [...prev, { ...u, custom_amount: '' }]);
    setMemberSearch(''); setSearchResults([]);
  }

  function removeMember(id: string) { setMembers(prev => prev.filter(m => m.user_id !== id)); }

  function updateCustomAmount(id: string, val: string) {
    setMembers(prev => prev.map(m => m.user_id === id ? { ...m, custom_amount: val } : m));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !userId || members.length < 2) return;
    if (!isContribution && !amount) return;
    if (isContribution && !targetAmount) return;
    setLoading(true);

    try {
      const totalAmt = isContribution ? parseFloat(targetAmount) : parseFloat(amount);
      const splitAmounts: Record<string, number> = {};
      const splitNames: Record<string, string> = {};

      if (splitMode === 'equal') {
        const each = totalAmt / members.length;
        members.forEach(m => { splitAmounts[m.user_id] = each; splitNames[m.user_id] = m.full_name; });
      } else {
        members.forEach(m => {
          splitAmounts[m.user_id] = m.custom_amount ? parseFloat(m.custom_amount) : 0;
          splitNames[m.user_id] = m.full_name;
        });
      }

      const { data: bill } = await supabase.from('bills').insert({
        title: title.trim(), amount: totalAmt, paid_by: userId,
        splits: { amounts: splitAmounts, names: splitNames },
        status: 'pending', mode: collectionMode, is_contribution: isContribution,
        target_amount: isContribution ? parseFloat(targetAmount) : null,
      }).select().single();

      if (bill) {
        for (const m of members) {
          await supabase.from('bill_members').insert({
            bill_id: bill.bill_id, user_id: m.user_id, full_name: m.full_name, username: m.username,
            amount_owed: splitAmounts[m.user_id] || 0,
          });
        }
      }

      setTitle(''); setAmount(''); setTargetAmount(''); setMembers([]);
      setShowForm(false); setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  // Add self to members when form opens
  function openForm() {
    if (userId) setMembers([{ user_id: userId, full_name: userName, username: '', custom_amount: '' }]);
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">BillSplit & Contributions</h1>
          <p className="text-slate-500 mt-1">Split expenses or make joint contributions — all recorded as evidence</p>
        </div>
        {!showForm && (
          <Button onClick={openForm} className="bg-pink-600 hover:bg-pink-700 text-white w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" /> New Bill / Contribution
          </Button>
        )}
      </div>

      {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-md text-sm">Bill created with all members recorded!</div>}

      {/* CREATE FORM */}
      {showForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 text-lg">Create New</h2>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
          </div>

          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button type="button" onClick={() => setIsContribution(false)}
              className={`p-4 rounded-xl border text-left transition-all ${!isContribution ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-200' : 'border-slate-200'}`}>
              <Wallet className="h-6 w-6 text-pink-600 mb-2" />
              <div className="font-semibold text-sm">Bill Split</div>
              <div className="text-xs text-slate-500">Split a shared expense</div>
            </button>
            <button type="button" onClick={() => setIsContribution(true)}
              className={`p-4 rounded-xl border text-left transition-all ${isContribution ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'border-slate-200'}`}>
              <Target className="h-6 w-6 text-purple-600 mb-2" />
              <div className="font-semibold text-sm">Joint Contribution</div>
              <div className="text-xs text-slate-500">Save together toward a goal</div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Description</Label>
              <Input placeholder={isContribution ? "e.g. New welding machine fund" : "e.g. Electricity bill"} value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" /></div>

            {isContribution ? (
              <div><Label>Target Amount (₦)</Label>
                <Input type="number" placeholder="e.g. 500000" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required className="mt-1" />
                <p className="text-xs text-slate-400 mt-1">5% fee if withdrawn before target is met (all members must agree)</p>
              </div>
            ) : (
              <div><Label>Total Amount (₦)</Label>
                <Input type="number" placeholder="e.g. 15000" value={amount} onChange={(e) => setAmount(e.target.value)} required className="mt-1" /></div>
            )}

            {/* Split Mode */}
            <div>
              <Label>How to split?</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button type="button" onClick={() => setSplitMode('equal')}
                  className={`p-2 rounded-lg border text-sm ${splitMode === 'equal' ? 'border-pink-500 bg-pink-50 ring-1 ring-pink-200' : 'border-slate-200'}`}>Equal Split</button>
                <button type="button" onClick={() => setSplitMode('custom')}
                  className={`p-2 rounded-lg border text-sm ${splitMode === 'custom' ? 'border-pink-500 bg-pink-50 ring-1 ring-pink-200' : 'border-slate-200'}`}>Custom Amounts</button>
              </div>
            </div>

            {/* Collection Mode */}
            <div>
              <Label>Collection method</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button type="button" onClick={() => setCollectionMode('escrow')}
                  className={`p-3 rounded-lg border text-left ${collectionMode === 'escrow' ? 'border-green-500 bg-green-50 ring-1 ring-green-200' : 'border-slate-200'}`}>
                  <Shield className="h-4 w-4 text-green-600 mb-1" />
                  <div className="text-sm font-medium">Platform Escrow</div>
                  <div className="text-[10px] text-slate-500">All approve before withdrawal</div>
                </button>
                <button type="button" onClick={() => setCollectionMode('self')}
                  className={`p-3 rounded-lg border text-left ${collectionMode === 'self' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'border-slate-200'}`}>
                  <Users className="h-4 w-4 text-blue-600 mb-1" />
                  <div className="text-sm font-medium">Self Collection</div>
                  <div className="text-[10px] text-slate-500">Collect among yourselves</div>
                </button>
              </div>
            </div>

            {/* Member Search */}
            <div>
              <Label>Members</Label>
              <div className="relative mt-1">
                <Input placeholder="Search users to add..." value={memberSearch} onChange={(e) => searchUsers(e.target.value)} />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button key={u.user_id} type="button" onClick={() => addMember(u)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-purple-500" /><span className="font-medium">{u.full_name}</span><span className="text-slate-400">@{u.username}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                  <span className="flex-1 text-sm font-medium">{m.full_name}</span>
                  {splitMode === 'custom' && (
                    <Input type="number" placeholder="Amount" value={m.custom_amount}
                      onChange={(e) => updateCustomAmount(m.user_id, e.target.value)} className="w-28 text-sm" />
                  )}
                  {m.user_id !== userId && (
                    <button type="button" onClick={() => removeMember(m.user_id)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
            </div>

            {members.length >= 2 && (amount || targetAmount) && splitMode === 'equal' && (
              <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm">
                Each person: <strong>₦{((isContribution ? parseFloat(targetAmount || '0') : parseFloat(amount || '0')) / members.length).toLocaleString()}</strong>
              </div>
            )}

            {members.length < 2 && <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded-md text-sm">Add at least 2 members</div>}

            <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white py-5" disabled={loading || members.length < 2}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" />{isContribution ? 'Start Contribution' : 'Create Bill'}</>}
            </Button>
          </form>
        </Card>
      )}

      {/* BILLS LIST */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Bills & Contributions</h2>
        {bills.length > 0 ? bills.map((bill) => {
          const splitData = (bill.splits || {}) as { names?: Record<string, string> } & Record<string, unknown>;
          const names = splitData.names || {};
          const memberCount = Object.keys(names).length || Object.keys(splitData || {}).length;

          return (
            <Link key={bill.bill_id} href={`/billsplit/${bill.bill_id}`}>
              <Card className="p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{bill.title}</h3>
                    {bill.is_demo && <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">DEMO</Badge>}
                    {bill.is_contribution && <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px]">Contribution</Badge>}
                    {bill.mode === 'escrow' && <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">Escrow</Badge>}
                  </div>
                  <Badge className={`border-0 ${bill.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{bill.status}</Badge>
                </div>
                <p className="text-sm text-slate-500">₦{bill.amount?.toLocaleString()} • {memberCount} members</p>
                {Object.values(names).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.values(names as Record<string, string>).map((n, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{n}</Badge>
                    ))}
                  </div>
                )}
              </Card>
            </Link>
          );
        }) : (
          <Card className="p-8 text-center">
            <Wallet className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No bills yet. Create one above!</p>
          </Card>
        )}
      </div>
    </div>
  );
}