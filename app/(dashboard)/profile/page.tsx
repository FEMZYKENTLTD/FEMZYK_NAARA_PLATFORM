'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LogOut, User, Shield, Loader2, Camera, MapPin, Globe, Edit, X, Save
} from 'lucide-react';
import Link from 'next/link';

interface ProfileData {
  user_id: string;
  full_name: string;
  username: string;
  role: string;
  trust_score: number;
  is_verified: boolean;
  email: string | null;
  language: string | null;
  registration_date: string | null;
  profile_photo?: string | null;
  cover_photo?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  trade?: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const coverPhotoRef = useRef<HTMLInputElement>(null);
  const hasLoadedRef = useRef(false);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({ skills: 0, gigs: 0, posts: 0, followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [trade, setTrade] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('apprentice');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        // Use session first to avoid multiple concurrent auth lock requests.
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) {
          if (mounted) setLoading(false);
          return;
        }

        if (mounted) setAuthUserId(user.id);
        const { data: p } = await supabase.from('users').select('*').eq('auth_id', user.id).single();
        if (p && mounted) {
          setProfile(p as ProfileData);
          setBio(p.bio || '');
          setLocation(p.location || '');
          setWebsite(p.website || '');
          setTrade(p.trade || '');
          setFullName(p.full_name || '');
          setUsername(p.username || '');
          setRole(p.role || 'apprentice');
          setLanguage((p.language as string) || 'en');
          setProfileMissing(false);

          const [skillsRes, postsRes, followersRes, followingRes] = await Promise.all([
            supabase.from('apprentice_skills').select('apprentice_skill_id', { count: 'exact', head: true }).eq('user_id', p.user_id),
            supabase.from('posts').select('post_id', { count: 'exact', head: true }).eq('user_id', p.user_id).eq('is_deleted', false),
            supabase.from('follows').select('follow_id', { count: 'exact', head: true }).eq('following_id', p.user_id),
            supabase.from('follows').select('follow_id', { count: 'exact', head: true }).eq('follower_id', p.user_id),
          ]);
          setStats({
            skills: skillsRes.count || 0,
            gigs: 0,
            posts: postsRes.count || 0,
            followers: followersRes.count || 0,
            following: followingRes.count || 0,
          });
        }
        if (!p && mounted) {
          // Profile row might not exist yet (race/RLS). Provide a completion UI.
          const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
          setProfile(null);
          setProfileMissing(true);
          setFullName(typeof meta.full_name === 'string' ? meta.full_name : '');
          setUsername(typeof meta.username === 'string' ? meta.username : '');
          setRole(typeof meta.role === 'string' ? meta.role : 'apprentice');
          setLanguage(typeof meta.language === 'string' ? meta.language : 'en');
          setBio('');
          setTrade(typeof meta.trade === 'string' ? meta.trade : '');
          setLocation('');
          setWebsite('');
        }
      } catch (err) {
        console.error('Failed loading profile page:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [supabase]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5MB'); return; }
    if (!file.type.startsWith('image/')) { alert('Please select an image'); return; }

    if (type === 'profile') setUploadingProfile(true);
    else setUploadingCover(true);

    const ext = file.name.split('.').pop();
    const fileName = `${profile.user_id}/${type}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('forum-media').upload(fileName, file);

    if (!upErr) {
      const { data: urlData } = supabase.storage.from('forum-media').getPublicUrl(fileName);
      const field = type === 'profile' ? 'profile_photo' : 'cover_photo';
      await supabase.from('users').update({ [field]: urlData.publicUrl }).eq('user_id', profile.user_id);
      setProfile({ ...profile, [field]: urlData.publicUrl });
    }

    if (type === 'profile') setUploadingProfile(false);
    else setUploadingCover(false);
  }

  async function handleSaveProfile() {
    if (!profile) return;
    setSaving(true);
    await supabase.from('users').update({
      full_name: fullName.trim(),
      bio: bio.trim() || null,
      location: location.trim() || null,
      website: website.trim() || null,
      trade: trade.trim() || null,
    }).eq('user_id', profile.user_id);
    setProfile({ ...profile, full_name: fullName, bio, location, website, trade });
    setEditing(false);
    setSaving(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;

  if (profileMissing && authUserId) {
    async function handleCreateProfile() {
      setSaving(true);
      try {
        const payload = {
          auth_id: authUserId,
          full_name: fullName.trim(),
          username: username.toLowerCase().trim(),
          email: null,
          role,
          trust_score: 0,
          language,
          is_verified: false,
          consent_flags: {},
          trade: trade.trim() || null,
          bio: bio.trim() || null,
          location: location.trim() || null,
          website: website.trim() || null,
        };

        const { error: insertError } = await supabase.from('users').insert(payload);
        if (insertError) throw insertError;

        const { data: p2 } = await supabase.from('users').select('*').eq('auth_id', authUserId).single();
        if (p2) {
          setProfile(p2 as ProfileData);
          setProfileMissing(false);
          setEditing(false);
        }
      } catch (err) {
        console.error('Failed to create missing profile:', err);
        alert('Could not complete your profile. Please try again.');
      } finally {
        setSaving(false);
      }
    }

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900">Complete Profile</h1>
        <p className="text-sm text-slate-500">
          Your account was created, but your public profile record is missing. Complete the form below to continue.
        </p>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Trade / Industry</Label>
              <Input value={trade} onChange={(e) => setTrade(e.target.value)} className="mt-1" placeholder="e.g. Auto Mechanics" />
            </div>
            <div>
              <Label>Language</Label>
              <Input value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Bio</Label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={200}
                placeholder="Tell people about yourself..."
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lagos, Nigeria" className="mt-1" />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <Label>Role</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="apprentice">apprentice</option>
                <option value="master">master</option>
                <option value="freelancer">freelancer</option>
                <option value="employer">employer</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <Button
              onClick={handleCreateProfile}
              disabled={saving || !fullName.trim() || !username.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Public Profile
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>

      <Card className="overflow-hidden">
        <div className="relative h-32 sm:h-44 bg-linear-to-r from-purple-600 to-blue-600 cursor-pointer group"
          onClick={() => coverPhotoRef.current?.click()}>
          {profile?.cover_photo && (
            <img src={profile.cover_photo} alt="Cover" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
              {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {uploadingCover ? 'Uploading...' : 'Change Cover Photo'}
            </div>
          </div>
          <input ref={coverPhotoRef} type="file" accept="image/*"
            onChange={(e) => handlePhotoUpload(e, 'cover')}
            className="hidden"
            onClick={(e) => e.stopPropagation()} />
        </div>

        <div className="p-6 -mt-12 relative">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-purple-100 flex items-center justify-center overflow-hidden shadow-lg">
              {profile?.profile_photo ? (
                <img src={profile.profile_photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-purple-600" />
              )}
            </div>
            <input ref={profilePhotoRef} type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'profile')} className="hidden" />
            <button onClick={() => profilePhotoRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-purple-700">
              {uploadingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
          </div>

          {editing ? (
            <div className="space-y-3 mb-4">
              <div><Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" /></div>
              <div><Label>Bio</Label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={200}
                  placeholder="Tell people about yourself..."
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 resize-none" />
                <p className="text-xs text-slate-400 mt-1">{bio.length}/200</p>
              </div>
              <div><Label>Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lagos, Nigeria" className="mt-1" /></div>
              <div><Label>Trade / Industry</Label>
                <Input value={trade} onChange={(e) => setTrade(e.target.value)} placeholder="e.g. Auto Mechanics" className="mt-1" /></div>
              <div><Label>Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className="mt-1" /></div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} disabled={saving} className="bg-purple-600 text-white">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{profile?.full_name || 'User'}</h2>
                <button onClick={() => setEditing(true)} className="text-purple-600 hover:text-purple-800">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
              <p className="text-slate-500">@{profile?.username || 'unknown'}</p>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className="capitalize bg-purple-100 text-purple-700 border-0">{profile?.role}</Badge>
                <Badge className={`border-0 ${profile?.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {profile?.is_verified ? 'Verified' : 'Pending Verification'}
                </Badge>
                {profile?.trade && <Badge variant="outline" className="text-xs">{profile.trade}</Badge>}
              </div>

              {profile?.bio && <p className="text-sm text-slate-600 mt-3">{profile.bio}</p>}

              <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-400">
                {profile?.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>}
                {profile?.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-purple-600 hover:underline">
                    <Globe className="h-3 w-3" />{profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-5 gap-2 mb-4">
            {[
              { label: 'Followers', value: stats.followers },
              { label: 'Following', value: stats.following },
              { label: 'Skills', value: stats.skills },
              { label: 'Posts', value: stats.posts },
              { label: 'Gigs', value: stats.gigs },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-lg font-bold text-slate-900">{s.value}</div>
                <div className="text-[10px] text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-linear-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-slate-900">Trust Score</span>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-purple-300 flex items-center justify-center bg-white">
                <span className="text-xl font-bold text-purple-600">{profile?.trust_score || 0}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Email</span>
              <span className="text-slate-900">{profile?.email || 'Not set'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Language</span>
              <span className="text-slate-900 uppercase">{profile?.language || 'en'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Joined</span>
              <span className="text-slate-900">{profile?.registration_date ? new Date(profile.registration_date).toLocaleDateString() : 'Unknown'}</span>
            </div>
          </div>

          <Link href={`/user/${profile?.user_id}`}>
            <Card className="p-3 text-center text-purple-600 hover:bg-purple-50 cursor-pointer mb-4 text-sm">
              View my public profile →
            </Card>
          </Link>
        </div>
      </Card>

      <Button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 text-white py-5">
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
}
