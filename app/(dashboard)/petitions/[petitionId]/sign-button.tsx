// app/(dashboard)/petitions/[petitionId]/sign-button.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, FileSignature, Loader2 } from 'lucide-react';

interface SignButtonProps {
  petitionId: string;
  userId: string;
  hasSigned: boolean;
  currentSignatures: string[];
  currentCount: number;
}

export default function SignButton({ petitionId, userId, hasSigned, currentSignatures, currentCount }: SignButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [signed, setSigned] = useState(hasSigned);

  async function handleSign() {
    if (signed) return;
    setLoading(true);

    try {
      const newSignatures = [...currentSignatures, userId];
      const { error } = await supabase
        .from('petitions')
        .update({
          signatures: newSignatures,
          signature_count: currentCount + 1,
        })
        .eq('petition_id', petitionId);

      if (!error) {
        setSigned(true);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (signed) {
    return (
      <Card className="p-5 text-center bg-green-50 border-green-200">
        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
        <p className="font-semibold text-green-800">You signed this petition!</p>
        <p className="text-sm text-green-600 mt-1">Thank you for your civic participation.</p>
      </Card>
    );
  }

  return (
    <Button onClick={handleSign} disabled={loading}
      className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg">
      {loading ? (
        <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Signing...</>
      ) : (
        <><FileSignature className="h-5 w-5 mr-2" />Sign This Petition</>
      )}
    </Button>
  );
}