// app/(dashboard)/user/[userId]/follow-button.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  followerId: string;
  followingId: string;
  isFollowing: boolean;
  userName?: string;
}

export default function FollowButton(props: FollowButtonProps) {
  const { followerId, followingId, isFollowing } = props;
  const router = useRouter();
  const supabase = createClient();
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      if (following) {
        // Unfollow
        await supabase.from('follows')
          .delete()
          .eq('follower_id', followerId)
          .eq('following_id', followingId);
        setFollowing(false);
      } else {
        // Follow
        await supabase.from('follows').insert({
          follower_id: followerId,
          following_id: followingId,
        });

        // Send notification to the followed user
        await supabase.from('notifications').insert({
          user_id: followingId,
          from_user_id: followerId,
          type: 'follow',
          title: 'New Follower!',
          message: `Someone started following you.`,
          link: `/user/${followerId}`,
        });

        setFollowing(true);
      }
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={loading}
      className={following
        ? 'bg-slate-200 text-slate-700 hover:bg-red-100 hover:text-red-700'
        : 'bg-purple-600 hover:bg-purple-700 text-white'
      }
      size="sm"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : following ? (
        <><UserMinus className="h-4 w-4 mr-1" />Unfollow</>
      ) : (
        <><UserPlus className="h-4 w-4 mr-1" />Follow</>
      )}
    </Button>
  );
}