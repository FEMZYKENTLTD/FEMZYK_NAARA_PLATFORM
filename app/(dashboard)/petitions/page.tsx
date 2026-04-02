// app/(dashboard)/petitions/page.tsx
// ============================================================================
// PetitionHub — Create and sign petitions for civic engagement
// ============================================================================

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  FileSignature,
  Plus,
  Users,
  Clock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'PetitionHub — FEMZYK NÀÁRA',
  description: 'Create and sign petitions to drive civic action in your community.',
};

export default async function PetitionsPage() {
  const supabase = await createClient();

  const { data: petitions } = await supabase
    .from('petitions')
    .select(`
      *,
      creator:users!petitions_created_by_fkey(full_name, username)
    `)
    .order('signature_count', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PetitionHub</h1>
          <p className="text-slate-500 mt-1">
            Raise your voice. Create or sign petitions for change.
          </p>
        </div>
        <Link href="/petitions/new">
          <Button className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Petition
          </Button>
        </Link>
      </div>

      {/* Petition List */}
      <div className="space-y-3">
        {petitions && petitions.length > 0 ? (
          petitions.map((petition) => {
            const creator = petition.creator as { full_name: string; username: string } | null;

            return (
              <Link key={petition.petition_id} href={`/petitions/${petition.petition_id}`}>
                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer mb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 text-lg">
                        {petition.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {petition.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {creator?.full_name || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(petition.created_at).toLocaleDateString()}
                        </span>
                        {petition.target_authority && (
                          <Badge variant="outline" className="text-[10px]">
                            To: {petition.target_authority}
                          </Badge>
                        )}
                        <Badge
                          className={`text-[10px] border-0 ${
                            petition.status === 'open'
                              ? 'bg-green-100 text-green-700'
                              : petition.status === 'responded'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {petition.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Signature count */}
                    <div className="text-center flex-shrink-0">
                      <div className="text-2xl font-bold text-red-600">
                        {petition.signature_count}
                      </div>
                      <div className="text-[10px] text-slate-400">signatures</div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card className="p-8 text-center">
            <FileSignature className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">No petitions yet</h3>
            <p className="text-slate-500 mt-1 mb-4">
              Be the first to create a petition for your community!
            </p>
            <Link href="/petitions/new">
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create First Petition
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}