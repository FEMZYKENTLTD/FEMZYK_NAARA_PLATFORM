'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ArrowLeft, User, Search, Loader2, Shield } from 'lucide-react';

const ROLES = ['user', 'apprentice', 'master', 'freelancer', 'employer', 'admin'];

interface AdminUser {
  user_id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  role: string;
  is_verified: boolean;
  trust_score: number | null;
  registration_date: string | null;
}

export default function AdminUsersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('*').order('registration_date', { ascending: false });
    setUsers((data || []) as AdminUser[]);
    setLoading(false);
  }, [supabase]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadUsers(); }, [loadUsers]);

  async function changeRole(userId: string, newRole: string) {
    setUpdating(userId);
    await supabase.from('users').update({ role: newRole }).eq('user_id', userId);
    await loadUsers();
    setUpdating(null);
  }

  async function toggleVerified(userId: string, current: boolean) {
    setUpdating(userId);
    await supabase.from('users').update({ is_verified: !current }).eq('user_id', userId);
    await loadUsers();
    setUpdating(null);
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Admin
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">User Management</h1>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search by name, username, or email..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>

      {loading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div> : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <Card key={u.user_id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900">{u.full_name}</div>
                    <div className="text-xs text-slate-400">@{u.username} • {u.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Role Selector */}
                  <select value={u.role} onChange={(e) => changeRole(u.user_id, e.target.value)}
                    disabled={updating === u.user_id}
                    className="text-sm border rounded-md px-2 py-1 bg-white">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>

                  {/* Verify Toggle */}
                  <Button size="sm" variant={u.is_verified ? 'default' : 'outline'}
                    onClick={() => toggleVerified(u.user_id, u.is_verified)}
                    disabled={updating === u.user_id}
                    className={u.is_verified ? 'bg-green-600 text-white' : ''}>
                    <Shield className="h-3 w-3 mr-1" />{u.is_verified ? 'Verified' : 'Verify'}
                  </Button>

                  {/* Trust Score */}
                  <Badge variant="outline" className="text-xs">{u.trust_score || 0}% trust</Badge>

                  {updating === u.user_id && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}