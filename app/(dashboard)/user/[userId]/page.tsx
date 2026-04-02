import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  ArrowLeft, User, Shield, MapPin, Globe, Clock,
  Wrench, MessageSquare, Image as ImageIcon,
  CalendarDays
} from 'lucide-react';
import FollowButton from './follow-button';
import MessageButton from './message-button';
import ReportUserModal from './report-user-modal';
import PhotoViewer from '../../photo-viewer';

interface ProfileSkill {
  skill_name?: string;
  level?: number;
  trade?: { trade_name?: string };
}

interface SuggestionUser {
  user_id: string;
  full_name: string;
  username: string;
  trust_score: number;
  role: string;
  profile_photo: string | null;
}

export default async function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  let profile = null;
  if (isUUID) { const { data } = await supabase.from('users').select('*').eq('user_id', userId).maybeSingle(); profile = data; }
  if (!profile) { const { data } = await supabase.from('users').select('*').eq('username', userId).maybeSingle(); profile = data; }

  const { data: { user } } = await supabase.auth.getUser();
  let currentUser = null;
  if (user) { const { data } = await supabase.from('users').select('user_id, phone_number').eq('auth_id', user.id).maybeSingle(); currentUser = data; }

  if (!profile) {
    return (<div className="text-center py-12 max-w-md mx-auto">
      <User className="h-16 w-16 text-slate-300 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-slate-900 mb-2">User Not Found</h1>
      <Link href="/home" className="text-purple-600 hover:underline">Back to Home</Link>
    </div>);
  }

  let isFollowing = false;
  if (currentUser && currentUser.user_id !== profile.user_id) {
    const { data } = await supabase.from('follows').select('follow_id')
      .eq('follower_id', currentUser.user_id).eq('following_id', profile.user_id).maybeSingle();
    isFollowing = !!data;
  }

  // All counts
  const [followers, following, userPosts, threads] = await Promise.all([
    supabase.from('follows').select('follow_id', { count: 'exact', head: true }).eq('following_id', profile.user_id),
    supabase.from('follows').select('follow_id', { count: 'exact', head: true }).eq('follower_id', profile.user_id),
    supabase.from('posts').select('post_id', { count: 'exact', head: true }).eq('user_id', profile.user_id).eq('is_deleted', false),
    supabase.from('threads').select('thread_id', { count: 'exact', head: true }).eq('created_by', profile.user_id).eq('is_deleted', false),
  ]);

  // Verified skills with trade names
  const { data: verifiedSkills } = await supabase.from('apprentice_skills')
    .select('*, skill:skills!apprentice_skills_skill_id_fkey(skill_name, level, trade:trades!skills_trade_id_fkey(trade_name))')
    .eq('user_id', profile.user_id).eq('status', 'verified').limit(10);

  // Followers list
  const { data: followersList } = await supabase.from('follows')
    .select('follower:users!follows_follower_id_fkey(user_id, full_name, username, profile_photo, trust_score, role)')
    .eq('following_id', profile.user_id).limit(20);

  // Following list
  const { data: followingList } = await supabase.from('follows')
    .select('following:users!follows_following_id_fkey(user_id, full_name, username, profile_photo, trust_score, role)')
    .eq('follower_id', profile.user_id).limit(20);

  // User posts with media
  const { data: posts } = await supabase.from('posts')
    .select('*, thread:threads!posts_thread_id_fkey(title, thread_id)')
    .eq('user_id', profile.user_id).eq('is_deleted', false)
    .order('created_at', { ascending: false }).limit(10);

  // User threads
  const { data: userThreads } = await supabase.from('threads')
    .select('*').eq('created_by', profile.user_id).eq('is_deleted', false)
    .order('created_at', { ascending: false }).limit(5);

  // Media gallery — collect all media from posts
  const allMedia: { url: string; type: string }[] = [];
  posts?.forEach(p => {
    const media = (p.media as { url: string; type: string }[]) || [];
    media.forEach(m => allMedia.push(m));
  });

  // Follow suggestions
  let suggestions: SuggestionUser[] = [];
  if (currentUser && currentUser.user_id === profile.user_id) {
    const { data: myFollowing } = await supabase.from('follows').select('following_id').eq('follower_id', currentUser.user_id);
    const myIds = myFollowing?.map(f => f.following_id) || [];
    if (myIds.length > 0) {
      const { data: suggested } = await supabase.from('follows')
        .select('following:users!follows_following_id_fkey(user_id, full_name, username, trust_score, role, profile_photo)')
        .in('follower_id', myIds)
        .not('following_id', 'in', `(${[...myIds, currentUser.user_id].join(',')})`)
        .limit(6);
      suggestions = (suggested || [])
        .map((row) => {
          const following = (row as { following?: SuggestionUser | SuggestionUser[] }).following;
          return Array.isArray(following) ? following[0] : following;
        })
        .filter(Boolean) as SuggestionUser[];
    }
    if (suggestions.length < 6) {
      const excludeIds = [
        ...(myFollowing?.map((f) => f.following_id) || []),
        currentUser.user_id,
        ...suggestions.map((s) => s.user_id).filter(Boolean),
      ];
      const { data: popular } = await supabase.from('users').select('user_id, full_name, username, trust_score, role, profile_photo')
        .not('user_id', 'in', `(${excludeIds.join(',')})`)
        .order('trust_score', { ascending: false }).limit(6 - suggestions.length);
      if (popular) suggestions = [...suggestions, ...(popular as SuggestionUser[])];
    }
  }

  // Mutual followers check
  let mutualCount = 0;
  if (currentUser && currentUser.user_id !== profile.user_id) {
    const { data: myFollowing } = await supabase.from('follows').select('following_id').eq('follower_id', currentUser.user_id);
    const myIds = new Set(myFollowing?.map(f => f.following_id) || []);
    const theirFollowers = followersList?.map((f) => (f.follower as { user_id?: string } | null)?.user_id).filter(Boolean) || [];
    mutualCount = theirFollowers.filter(id => myIds.has(id)).length;
  }

  const isOwnProfile = currentUser?.user_id === profile.user_id;
  const joinDate = new Date(profile.registration_date);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Link href="/home" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Link>

      {/* ===== PROFILE HEADER ===== */}
      <Card className="overflow-hidden">
        {/* Cover Photo — Clickable to enlarge */}
        <div className="h-36 sm:h-48 bg-linear-to-r from-purple-600 to-blue-600 relative">
          {profile.cover_photo ? (
            <PhotoViewer src={profile.cover_photo} alt={`${profile.full_name}'s cover`}>
              <img src={profile.cover_photo} alt="Cover" className="w-full h-full object-cover" />
            </PhotoViewer>
          ) : (
            <div className="w-full h-full bg-linear-to-r from-purple-600 via-purple-700 to-blue-600" />
          )}
        </div>

        <div className="px-6 pb-6 -mt-16 relative">
          {/* Profile Photo — Clickable to enlarge */}
          <div className="flex items-end gap-4 mb-4">
            <div className="shrink-0">
              {profile.profile_photo ? (
                <PhotoViewer src={profile.profile_photo} alt={profile.full_name}>
                  <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden shadow-lg bg-white">
                    <img src={profile.profile_photo} alt={profile.full_name} className="w-full h-full object-cover" />
                  </div>
                </PhotoViewer>
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-white bg-purple-100 flex items-center justify-center shadow-lg">
                  <User className="h-14 w-14 text-purple-600" />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex-1 pt-16" />
            {currentUser && !isOwnProfile && (
              <div className="flex gap-2 pt-16">
                <FollowButton followerId={currentUser.user_id} followingId={profile.user_id}
                  isFollowing={isFollowing} userName={profile.full_name} />
                <MessageButton senderId={currentUser.user_id} receiverId={profile.user_id} receiverName={profile.full_name} />
                <ReportUserModal
                  reporterUserId={currentUser.user_id}
                  targetUserId={profile.user_id}
                  targetReportedAccount={(profile.phone_number ?? profile.user_id) as string}
                  targetDisplayName={profile.full_name}
                />
              </div>
            )}
            {isOwnProfile && (
              <Link href="/profile" className="pt-16">
                <Badge className="bg-purple-100 text-purple-700 border-0 cursor-pointer hover:bg-purple-200">Edit Profile</Badge>
              </Link>
            )}
          </div>

          {/* Name + Username */}
          <h1 className="text-2xl font-bold text-slate-900">{profile.full_name}</h1>
          <p className="text-slate-500">@{profile.username}</p>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge className="capitalize bg-purple-100 text-purple-700 border-0">{profile.role}</Badge>
            {profile.is_verified && <Badge className="bg-green-100 text-green-700 border-0">✓ Verified</Badge>}
            {profile.trade && <Badge variant="outline" className="text-xs">{profile.trade}</Badge>}
          </div>

          {/* Bio */}
          {profile.bio && <p className="text-sm text-slate-700 mt-3 leading-relaxed">{profile.bio}</p>}

          {/* Info Row */}
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
            {profile.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-purple-600 hover:underline">
                <Globe className="h-3 w-3" />{profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />Joined {joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* Mutual followers */}
          {!isOwnProfile && mutualCount > 0 && (
            <p className="text-xs text-slate-500 mt-2">{mutualCount} mutual connection{mutualCount > 1 ? 's' : ''}</p>
          )}

          {/* Stats Row */}
          <div className="flex gap-6 mt-4 text-sm">
            <span><strong className="text-slate-900">{followers.count || 0}</strong> <span className="text-slate-500">Followers</span></span>
            <span><strong className="text-slate-900">{following.count || 0}</strong> <span className="text-slate-500">Following</span></span>
            <span><strong className="text-slate-900">{(userPosts.count || 0) + (threads.count || 0)}</strong> <span className="text-slate-500">Posts</span></span>
          </div>
        </div>
      </Card>

      {/* ===== TRUST SCORE ===== */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-slate-900">Trust Score</span>
            </div>
            <p className="text-xs text-slate-500">Based on verified skills, work history, and community activity</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-purple-300 flex items-center justify-center bg-linear-to-br from-purple-50 to-blue-50">
            <span className="text-xl font-bold text-purple-600">{profile.trust_score || 0}%</span>
          </div>
        </div>
        {/* Trust breakdown bar */}
        <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
          <div className="bg-linear-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all" style={{ width: `${profile.trust_score || 0}%` }} />
        </div>
      </Card>

      {/* ===== VERIFIED SKILLS ===== */}
      {verifiedSkills && verifiedSkills.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-600" /> Verified Skills ({verifiedSkills.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {verifiedSkills.map((vs) => {
              const skill = vs.skill as ProfileSkill | null;
              return (
                <Badge key={vs.apprentice_skill_id} className="bg-green-50 text-green-700 border border-green-200 px-3 py-1">
                  {skill?.skill_name || 'Unknown'} • Lv.{skill?.level || 1}
                  {skill?.trade?.trade_name && <span className="text-green-500 ml-1">({skill.trade.trade_name})</span>}
                </Badge>
              );
            })}
          </div>
        </Card>
      )}

      {/* ===== MEDIA GALLERY ===== */}
      {allMedia.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-pink-600" /> Media ({allMedia.length})
          </h2>
          <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
            {allMedia.slice(0, 9).map((m, i) => (
              <PhotoViewer key={i} src={m.url} alt="Media">
                <div className="aspect-square bg-slate-100 overflow-hidden">
                  {m.type.startsWith('video/') ? (
                    <video src={m.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={m.url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  )}
                </div>
              </PhotoViewer>
            ))}
          </div>
          {allMedia.length > 9 && (
            <p className="text-xs text-slate-400 text-center mt-2">+{allMedia.length - 9} more</p>
          )}
        </Card>
      )}

      {/* ===== FOLLOW SUGGESTIONS ===== */}
      {isOwnProfile && suggestions.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-3">People You May Know</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {suggestions.map((s, i) => {
              const u = s;
              if (!u?.user_id) return null;
              return (
                <Link key={u.user_id + i} href={`/user/${u.user_id}`}>
                  <Card className="p-3 text-center hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2 overflow-hidden">
                      {u.profile_photo ? <img src={u.profile_photo} alt="" className="w-full h-full object-cover" />
                        : <User className="h-6 w-6 text-purple-600" />}
                    </div>
                    <div className="text-sm font-medium text-slate-900 truncate">{u.full_name}</div>
                    <div className="text-[10px] text-slate-400 truncate">@{u.username}</div>
                    <Badge variant="outline" className="text-[10px] mt-1 capitalize">{u.role}</Badge>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* ===== FOLLOWERS LIST ===== */}
      {followersList && followersList.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Followers ({followers.count})</h2>
          <div className="space-y-1">
            {followersList.map((f) => {
              const follower = (f.follower as unknown as SuggestionUser | SuggestionUser[] | null);
              const u = Array.isArray(follower) ? follower[0] : follower;
              if (!u) return null;
              return (
                <Link key={u.user_id} href={`/user/${u.user_id}`}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {u.profile_photo ? <img src={u.profile_photo} alt="" className="w-full h-full object-cover" />
                        : <User className="h-5 w-5 text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{u.full_name}</div>
                      <div className="text-xs text-slate-400">@{u.username} • <span className="capitalize">{u.role}</span></div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{u.trust_score || 0}%</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* ===== FOLLOWING LIST ===== */}
      {followingList && followingList.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Following ({following.count})</h2>
          <div className="space-y-1">
            {followingList.map((f) => {
              const following = (f.following as unknown as SuggestionUser | SuggestionUser[] | null);
              const u = Array.isArray(following) ? following[0] : following;
              if (!u) return null;
              return (
                <Link key={u.user_id} href={`/user/${u.user_id}`}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {u.profile_photo ? <img src={u.profile_photo} alt="" className="w-full h-full object-cover" />
                        : <User className="h-5 w-5 text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{u.full_name}</div>
                      <div className="text-xs text-slate-400">@{u.username} • <span className="capitalize">{u.role}</span></div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{u.trust_score || 0}%</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* ===== THREADS CREATED ===== */}
      {userThreads && userThreads.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-orange-600" /> Threads ({threads.count})
          </h2>
          <div className="space-y-2">
            {userThreads.map((t) => (
              <Link key={t.thread_id} href={`/forum/${t.thread_id}`}>
                <div className="p-3 rounded-lg border hover:bg-slate-50 cursor-pointer mb-1">
                  <h3 className="text-sm font-medium text-slate-900">{t.title}</h3>
                  {t.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>}
                  <div className="text-[10px] text-slate-400 mt-1">{new Date(t.created_at).toLocaleDateString()}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* ===== RECENT POSTS ===== */}
      {posts && posts.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Recent Activity</h2>
          <div className="space-y-3">
            {posts.map((post) => {
              const media = (post.media as { url: string; type: string }[]) || [];
              const thread = post.thread as { title: string; thread_id: string } | null;
              return (
                <Link key={post.post_id} href={thread ? `/forum/${thread.thread_id}` : '#'}>
                  <div className="p-3 rounded-lg border hover:bg-slate-50 cursor-pointer mb-2">
                    {thread && <div className="text-xs text-purple-600 mb-1 font-medium">In: {thread.title}</div>}
                    <p className="text-sm text-slate-700 line-clamp-3">{post.content}</p>
                    {media.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {media.slice(0, 4).map((m, i) => (
                          <div key={i} className="w-16 h-16 rounded border overflow-hidden shrink-0">
                            {m.type.startsWith('video/') ? <video src={m.url} className="w-full h-full object-cover" />
                              : <img src={m.url} alt="" className="w-full h-full object-cover" />}
                          </div>
                        ))}
                        {media.length > 4 && <div className="w-16 h-16 rounded border flex items-center justify-center bg-slate-100 text-xs text-slate-500 shrink-0">+{media.length - 4}</div>}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(post.created_at).toLocaleDateString()}</span>
                      {post.is_edited && <span>(edited)</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}