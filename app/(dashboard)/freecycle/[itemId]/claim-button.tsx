// app/(dashboard)/freecycle/[itemId]/claim-button.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Hand } from 'lucide-react';

export default function ClaimButton({ itemId, userId }: { itemId: string; userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleClaim() {
    setLoading(true);
    try {
      await supabase
        .from('freecycle_items')
        .update({ status: 'claimed', claimed_by: userId })
        .eq('item_id', itemId);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClaim} disabled={loading}
      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg">
      {loading ? (
        <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Claiming...</>
      ) : (
        <><Hand className="h-5 w-5 mr-2" />Claim This Item</>
      )}
    </Button>
  );
}